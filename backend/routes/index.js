const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const userCtrl = require('../controllers/userController');
const supplierCtrl = require('../controllers/supplierController');
const productCtrl = require('../controllers/productController');
const billCtrl = require('../controllers/billController');

const router = express.Router();

// Auth
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.me);
router.put('/auth/change-password', authenticate, authCtrl.changePassword);

// Users (admin only)
router.get('/users', authenticate, authorize('admin'), userCtrl.getAll);
router.post('/users', authenticate, authorize('admin'), userCtrl.create);
router.put('/users/:id', authenticate, authorize('admin'), userCtrl.update);
router.delete('/users/:id', authenticate, authorize('admin'), userCtrl.remove);

// Suppliers
router.get('/suppliers', authenticate, supplierCtrl.getAll);
router.get('/suppliers/:id', authenticate, supplierCtrl.getOne);
router.post('/suppliers', authenticate, authorize('admin', 'manager'), supplierCtrl.create);
router.put('/suppliers/:id', authenticate, authorize('admin', 'manager'), supplierCtrl.update);
router.delete('/suppliers/:id', authenticate, authorize('admin'), supplierCtrl.remove);

// Products
router.get('/products', authenticate, productCtrl.getAll);
router.get('/products/stats', authenticate, productCtrl.getStats);
router.get('/products/code/:code', authenticate, productCtrl.getByCode);
router.get('/products/:id', authenticate, productCtrl.getOne);
router.post('/products', authenticate, authorize('admin', 'manager'), productCtrl.create);
router.put('/products/:id', authenticate, authorize('admin', 'manager'), productCtrl.update);
router.delete('/products/:id', authenticate, authorize('admin'), productCtrl.remove);

// Bills
router.get('/bills', authenticate, billCtrl.getAll);
router.get('/bills/dashboard', authenticate, billCtrl.getDashboardStats);
router.get('/bills/:id', authenticate, billCtrl.getOne);
router.post('/bills', authenticate, billCtrl.create);
router.put('/bills/:id/void', authenticate, authorize('admin', 'manager'), billCtrl.voidBill);

module.exports = router;
