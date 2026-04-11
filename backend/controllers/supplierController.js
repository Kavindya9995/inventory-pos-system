const { pool } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Supplier not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, contact, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ message: 'Supplier name required' });
    const [result] = await pool.query(
      'INSERT INTO suppliers (name, contact, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [name, contact || null, phone || null, email || null, address || null]
    );
    res.status(201).json({ id: result.insertId, name, contact, phone, email, address });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, contact, phone, email, address } = req.body;
    await pool.query(
      'UPDATE suppliers SET name=?, contact=?, phone=?, email=?, address=? WHERE id=?',
      [name, contact || null, phone || null, email || null, address || null, req.params.id]
    );
    res.json({ message: 'Supplier updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
