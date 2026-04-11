require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, initDB } = require('../config/db');

const seed = async () => {
  await initDB();

  // Admin user
  const hashed = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name=name`,
    ['Administrator', 'admin', hashed, 'admin']
  );

  // Sample supplier
  // const [existing] = await pool.query("SELECT id FROM suppliers WHERE name = 'Demo Supplier'");
  // let supplierId;
  // if (!existing.length) {
  //   const [sup] = await pool.query(
  //     "INSERT INTO suppliers (name, contact, phone, email) VALUES ('Demo Supplier', 'John Demo', '0771234567', 'demo@supplier.com')"
  //   );
  //   supplierId = sup.insertId;
  // } else {
  //   supplierId = existing[0].id;
  // }

  // Sample products
  // const products = [
  //   ['PRD001', 'White T-Shirt', supplierId, 'SUP-TS-001', 450.00, 750.00, 'M', 50, JSON.stringify(['White', 'Black', 'Blue'])],
  //   ['PRD002', 'Slim Fit Jeans', supplierId, 'SUP-JN-002', 1200.00, 2200.00, '32', 30, JSON.stringify(['Blue', 'Black'])],
  //   ['PRD003', 'Running Shoes', supplierId, 'SUP-SH-003', 2500.00, 4500.00, '42', 20, JSON.stringify(['Red', 'White'])],
  //   ['PRD004', 'Canvas Bag', supplierId, 'SUP-BG-004', 350.00, 650.00, 'ONE SIZE', 4, JSON.stringify(['Brown', 'Black'])],
  //   ['PRD005', 'Formal Shirt', supplierId, 'SUP-FS-005', 800.00, 1500.00, 'L', 0, JSON.stringify(['White', 'Light Blue'])],
  // ];

  // for (const p of products) {
  //   await pool.query(
  //     `INSERT INTO products (code, name, supplier_id, supplier_code, supplier_price, selling_price, size, quantity, colors)
  //      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  //      ON DUPLICATE KEY UPDATE name=name`,
  //     p
  //   );
  // }

  console.log('✅ Seed complete!');
  console.log('👤 Admin: username=admin, password=admin123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
