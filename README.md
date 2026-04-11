# ShopMaster — Inventory & Billing System

A full-stack shop management system built with React + Node.js + MySQL.

---

## Features

- **Multi-user authentication** with roles: Admin, Manager, Cashier
- **Product management** — code, supplier info, prices, sizes, colors, stock quantities
- **Supplier management**
- **POS Billing** — scan/search products, add to bill, auto-deduct inventory
- **Bill history** — filter by date, customer, status; void bills (restores stock)
- **Print receipts** — clean thermal-style print layout
- **Price tags with barcodes** — CODE128 auto-generated from product code, print multiple copies
- **Dashboard** — today's revenue, bills, low stock alerts

---

## Project Structure

```
shopmaster/
├── backend/                   # Node.js + Express API
│   ├── config/
│   │   └── db.js              # MySQL connection pool + auto DB init
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── billController.js
│   │   ├── productController.js
│   │   ├── supplierController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── auth.js            # JWT authentication + role authorization
│   ├── routes/
│   │   └── index.js           # All API routes
│   ├── utils/
│   │   └── seed.js            # Database seed script
│   ├── .env.example
│   ├── package.json
│   └── server.js              # Express app entry point
│
└── frontend/                  # React app
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api/
    │   │   └── index.js       # Axios API client
    │   ├── components/
    │   │   ├── ColorTagsInput.jsx
    │   │   ├── ConfirmDialog.jsx
    │   │   ├── Layout.jsx
    │   │   └── Modal.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── auth/LoginPage.jsx
    │   │   ├── billing/BillingPage.jsx
    │   │   ├── billing/BillHistoryPage.jsx
    │   │   ├── billing/BillDetailPage.jsx
    │   │   ├── dashboard/DashboardPage.jsx
    │   │   ├── inventory/InventoryPage.jsx
    │   │   ├── inventory/SuppliersPage.jsx
    │   │   ├── tags/PriceTagsPage.jsx
    │   │   └── users/UsersPage.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   └── index.js
    ├── .env
    └── package.json
```

---

## Setup Guide

### Prerequisites

- Node.js v18+
- MySQL 8.0+
- npm or yarn

---

### 1. MySQL Setup

Create a MySQL user and note your credentials. The app will **auto-create the database and tables** on first start.

```sql
-- Optional: create a dedicated user
CREATE USER 'shopmaster'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON shopmaster.* TO 'shopmaster'@'localhost';
FLUSH PRIVILEGES;
```

---

### 2. Backend Setup

```bash
cd shopmaster/backend

# Install dependencies
npm install

# Copy env file and configure
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root              # your MySQL username
DB_PASSWORD=yourpassword  # your MySQL password
DB_NAME=shopmaster
JWT_SECRET=change_this_to_a_random_string_in_production
JWT_EXPIRES_IN=7d
SHOP_NAME=Your Shop Name
CLIENT_URL=http://localhost:3000
```

```bash
# Start server (auto-creates DB tables)
npm run dev

# Seed with sample data + default admin user
npm run seed
```

Default admin credentials after seeding:
- **Username:** `admin`
- **Password:** `admin123`

---

### 3. Frontend Setup

```bash
cd shopmaster/frontend

# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

### 4. Production Build

```bash
# Frontend
cd frontend && npm run build

# Serve the build folder with nginx or any static server
# Point nginx to frontend/build and proxy /api to backend:5000
```

---

## User Roles

| Feature                    | Admin | Manager | Cashier |
|---------------------------|-------|---------|---------|
| Dashboard                 | ✅    | ✅      | ✅      |
| View products             | ✅    | ✅      | ✅      |
| Add/edit products         | ✅    | ✅      | ❌      |
| Delete products           | ✅    | ❌      | ❌      |
| View suppliers            | ✅    | ✅      | ✅      |
| Add/edit suppliers        | ✅    | ✅      | ❌      |
| Create bills              | ✅    | ✅      | ✅      |
| Void bills                | ✅    | ✅      | ❌      |
| Print receipts/tags       | ✅    | ✅      | ✅      |
| Manage users              | ✅    | ❌      | ❌      |

---

## API Reference

| Method | Endpoint                  | Description                  |
|--------|---------------------------|------------------------------|
| POST   | /api/auth/login           | Login                        |
| GET    | /api/auth/me              | Current user                 |
| GET    | /api/products             | List products (with filters) |
| POST   | /api/products             | Create product               |
| PUT    | /api/products/:id         | Update product               |
| GET    | /api/products/code/:code  | Get by barcode/code          |
| GET    | /api/suppliers            | List suppliers               |
| POST   | /api/bills                | Create bill (deducts stock)  |
| GET    | /api/bills/:id            | Get bill with items          |
| PUT    | /api/bills/:id/void       | Void bill (restores stock)   |
| GET    | /api/bills/dashboard      | Dashboard stats              |
| GET    | /api/users                | List users (admin only)      |

---

## Tech Stack

**Backend:** Node.js, Express, MySQL2, JWT, bcryptjs  
**Frontend:** React 18, React Query, React Router v6, Axios, react-to-print, JsBarcode  
**Database:** MySQL 8.0

---

## Notes

- All prices are in **LKR (Sri Lankan Rupees)**
- Barcodes use **CODE128** format — compatible with most barcode scanners
- Bills automatically deduct inventory on creation; voiding a bill restores stock
- Database and all tables are created automatically on server start
