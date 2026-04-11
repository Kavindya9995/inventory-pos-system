const { pool } = require('../config/db');

const parseColors = (colors) => {
  if (!colors) return [];
  if (Array.isArray(colors)) return colors;
  const str = String(colors).trim();
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    // Fallback: treat as comma-separated string e.g. "Dark Blue,Brown"
    return str.split(',').map(c => c.trim()).filter(Boolean);
  }
};

const getAll = async (req, res) => {
  try {
    const { search, supplier_id, low_stock } = req.query;
    let sql = `
      SELECT p.*, s.name AS supplier_name
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = TRUE
    `;
    const params = [];

    if (search) {
      sql += ' AND (p.code LIKE ? OR p.name LIKE ? OR p.supplier_code LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (supplier_id) {
      sql += ' AND p.supplier_id = ?';
      params.push(supplier_id);
    }
    if (low_stock === 'true') {
      sql += ' AND p.quantity < 5';
    }
    sql += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(sql, params);
    // Parse colors JSON
    const products = rows.map(p => ({
      ...p,
      colors: p.colors ? parseColors(p.colors) : [],
    }));
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.name AS supplier_name
       FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    const p = rows[0];
    p.colors = p.colors ? parseColors(p.colors) : [];
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getByCode = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.name AS supplier_name
       FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.code = ? AND p.is_active = TRUE`,
      [req.params.code]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    const p = rows[0];
    p.colors = p.colors ? parseColors(p.colors) : [];
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { code, name, supplier_id, supplier_code, supplier_price, selling_price, size, quantity, colors, description } = req.body;
    if (!code || !name) return res.status(400).json({ message: 'Code and name required' });

    const [exists] = await pool.query('SELECT id FROM products WHERE code = ?', [code]);
    if (exists.length) return res.status(409).json({ message: 'Product code already exists' });

    const [result] = await pool.query(
      `INSERT INTO products (code, name, supplier_id, supplier_code, supplier_price, selling_price, size, quantity, colors, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code, name,
        supplier_id || null, supplier_code || null,
        supplier_price || 0, selling_price || 0,
        size || null,
        quantity || 0,
        colors ? JSON.stringify(colors) : null,
        description || null,
      ]
    );
    res.status(201).json({ id: result.insertId, code, name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, supplier_id, supplier_code, supplier_price, selling_price, size, quantity, colors, description, is_active } = req.body;
    const { id } = req.params;

    await pool.query(
      `UPDATE products SET name=?, supplier_id=?, supplier_code=?, supplier_price=?,
       selling_price=?, size=?, quantity=?, colors=?, description=?, is_active=?
       WHERE id=?`,
      [
        name, supplier_id || null, supplier_code || null,
        supplier_price || 0, selling_price || 0,
        size || null, quantity || 0,
        colors ? JSON.stringify(colors) : null,
        description || null,
        is_active !== undefined ? is_active : true,
        id,
      ]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM products WHERE is_active = TRUE');
    const [[{ low_stock }]] = await pool.query('SELECT COUNT(*) AS low_stock FROM products WHERE is_active = TRUE AND quantity < 5');
    const [[{ out_of_stock }]] = await pool.query('SELECT COUNT(*) AS out_of_stock FROM products WHERE is_active = TRUE AND quantity = 0');
    res.json({ total, low_stock, out_of_stock });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, getOne, getByCode, create, update, remove, getStats };
