const { pool } = require('../config/db');

const generateBillNumber = () => {
  const d = new Date();
  const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `BILL-${datePart}-${rand}`;
};

const getAll = async (req, res) => {
  try {
    const { date_from, date_to, status, search } = req.query;
    let sql = `
      SELECT b.*, u.name AS cashier_name,
             COUNT(bi.id) AS item_count
      FROM bills b
      LEFT JOIN users u ON b.created_by = u.id
      LEFT JOIN bill_items bi ON b.id = bi.bill_id
      WHERE 1=1
    `;
    const params = [];

    if (date_from) { sql += ' AND DATE(b.created_at) >= ?'; params.push(date_from); }
    if (date_to)   { sql += ' AND DATE(b.created_at) <= ?'; params.push(date_to); }
    if (status)    { sql += ' AND b.status = ?'; params.push(status); }
    if (search)    {
      sql += ' AND (b.bill_number LIKE ? OR b.customer_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY b.id ORDER BY b.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const [bills] = await pool.query(
      `SELECT b.*, u.name AS cashier_name
       FROM bills b LEFT JOIN users u ON b.created_by = u.id
       WHERE b.id = ?`,
      [req.params.id]
    );
    if (!bills.length) return res.status(404).json({ message: 'Bill not found' });

    const [items] = await pool.query(
      'SELECT * FROM bill_items WHERE bill_id = ?',
      [req.params.id]
    );

    res.json({ ...bills[0], items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { customer_name, customer_phone, items, discount = 0, tax = 0, payment_method = 'cash', notes, customer_paid } = req.body;

    if (!items || !items.length)
      return res.status(400).json({ message: 'At least one item required' });

    // Validate stock
    for (const item of items) {
      const [rows] = await conn.query(
        'SELECT id, name, quantity, selling_price FROM products WHERE id = ? AND is_active = TRUE FOR UPDATE',
        [item.product_id]
      );
      if (!rows.length) {
        await conn.rollback();
        return res.status(404).json({ message: `Product ID ${item.product_id} not found` });
      }
      if (rows[0].quantity < item.quantity) {
        await conn.rollback();
        return res.status(400).json({ message: `Insufficient stock for "${rows[0].name}". Available: ${rows[0].quantity}` });
      }
    }

    const subtotal = items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
    const total = subtotal - parseFloat(discount) + parseFloat(tax);
    const bill_number = generateBillNumber();

    const [billResult] = await conn.query(
      `INSERT INTO bills (bill_number, customer_name, customer_phone, subtotal, discount, tax, total, payment_method, notes,customer_paid, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [bill_number, customer_name || null, customer_phone || null, subtotal, discount, tax, total, payment_method, notes || null,customer_paid, req.user.id]
    );
    const billId = billResult.insertId;

    for (const item of items) {
      const [productRows] = await conn.query(
        'SELECT code, name, size, selling_price FROM products WHERE id = ?',
        [item.product_id]
      );
      const product = productRows[0];

      await conn.query(
        `INSERT INTO bill_items (bill_id, product_id, product_code, product_name, size, color, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [billId, item.product_id, product.code, item.product_name || product.name, item.size || product.size, item.color || null, item.quantity, item.unit_price, item.unit_price * item.quantity]
      );

      // Deduct inventory
      await conn.query(
        'UPDATE products SET quantity = quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await conn.commit();

    const [created] = await conn.query(
      `SELECT b.*, u.name AS cashier_name FROM bills b
       LEFT JOIN users u ON b.created_by = u.id WHERE b.id = ?`,
      [billId]
    );
    const [createdItems] = await conn.query('SELECT * FROM bill_items WHERE bill_id = ?', [billId]);

    res.status(201).json({ ...created[0], items: createdItems });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};

const voidBill = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [bills] = await conn.query('SELECT * FROM bills WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!bills.length) return res.status(404).json({ message: 'Bill not found' });
    if (bills[0].status === 'voided') return res.status(400).json({ message: 'Bill already voided' });

    // Restore inventory
    const [items] = await conn.query('SELECT * FROM bill_items WHERE bill_id = ?', [req.params.id]);
    for (const item of items) {
      await conn.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.query('UPDATE bills SET status = ? WHERE id = ?', ['voided', req.params.id]);
    await conn.commit();

    res.json({ message: 'Bill voided and stock restored' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [[todayBills]] = await pool.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(total),0) AS revenue
       FROM bills WHERE DATE(created_at) = ? AND status = 'completed'`,
      [today]
    );
    const [[monthBills]] = await pool.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(total),0) AS revenue
       FROM bills WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND status = 'completed'`
    );
    const [recentBills] = await pool.query(
      `SELECT b.id, b.bill_number, b.customer_name, b.total, b.created_at, u.name AS cashier_name,
              COUNT(bi.id) AS item_count
       FROM bills b LEFT JOIN users u ON b.created_by = u.id
       LEFT JOIN bill_items bi ON b.id = bi.bill_id
       WHERE b.status = 'completed'
       GROUP BY b.id ORDER BY b.created_at DESC LIMIT 5`
    );

    res.json({
      today: { count: todayBills.count, revenue: parseFloat(todayBills.revenue) },
      month: { count: monthBills.count, revenue: parseFloat(monthBills.revenue) },
      recent: recentBills,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, getOne, create, voidBill, getDashboardStats };
