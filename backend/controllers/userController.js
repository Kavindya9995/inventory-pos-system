const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, username, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password || !role)
      return res.status(400).json({ message: 'All fields required' });

    const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (exists.length) return res.status(409).json({ message: 'Username already taken' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
      [name, username, hashed, role]
    );
    res.status(201).json({ id: result.insertId, name, username, role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, role, is_active, password } = req.body;
    const { id } = req.params;

    const updates = [];
    const vals = [];

    if (name) { updates.push('name = ?'); vals.push(name); }
    if (role) { updates.push('role = ?'); vals.push(role); }
    if (is_active !== undefined) { updates.push('is_active = ?'); vals.push(is_active); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      vals.push(hashed);
    }

    if (!updates.length) return res.status(400).json({ message: 'Nothing to update' });

    vals.push(id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, vals);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id)
      return res.status(400).json({ message: 'Cannot delete yourself' });
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAll, create, update, remove };
