// routes/productRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Product API Routes for DreamyCrochet05
// Base path: /api/products (mounted in server.js)
//
// PUBLIC routes (no auth):
//   GET  /api/products           → All visible products (isVisible: true)
//   GET  /api/products/:id       → Single product by ID
//   POST /api/products/:id/view  → Increment view count
//
// PROTECTED routes (JWT required):
//   GET    /api/products/stats           → Dashboard analytics
//   GET    /api/products/all             → All products including hidden (admin)
//   POST   /api/products                 → Add new product
//   PUT    /api/products/:id             → Update product
//   DELETE /api/products/:id             → Delete product
//   PATCH  /api/products/:id/visibility  → Toggle hide/show
//   PATCH  /api/products/:id/featured    → Toggle featured status
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

// Controllers
const {
  getProducts,
  getProductStats,
  getProductById,
  incrementViewCount,
  addProduct,
  editProduct,
  deleteProduct,
  toggleVisibility,
  toggleFeatured
} = require('../controllers/productController');

// Middleware
const authAdmin = require('../middleware/authMiddleware');
const { uploadProductImage } = require('../middleware/uploadCloudinary');
const validateProduct = require('../middleware/validateProduct');

// ── Optional Admin Request Marker ─────────────────────────────────────────────
// Allows admin to fetch ALL products (including hidden) through the same GET /
// by adding an Authorization header. If token is valid, sets req.adminRequested
const optionalAdminAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'dreamy_crochet_secure_fallback_2026';

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded?.role === 'admin') {
      req.adminRequested = true;
    }
    next(); // Always proceed, even if token invalid
  });
};

// ── PUBLIC ROUTES ────────────────────────────────────────────────────────────

// GET /api/products — visible products for visitors, all for admin
router.get('/', optionalAdminAuth, getProducts);

// GET /api/products/:id — single product
router.get('/:id', getProductById);

// POST /api/products/:id/view — increment view counter (MUST be before /:id routes)
router.post('/:id/view', incrementViewCount);

// ── PROTECTED ROUTES (JWT required) ─────────────────────────────────────────

// GET /api/products/admin/stats — dashboard analytics
router.get('/admin/stats', authAdmin, getProductStats);

// POST /api/products — add new product (with optional image upload)
router.post('/', authAdmin, uploadProductImage, validateProduct, addProduct);

// PUT /api/products/:id — update product (with optional image upload)
router.put('/:id', authAdmin, uploadProductImage, validateProduct, editProduct);

// DELETE /api/products/:id — permanently delete
router.delete('/:id', authAdmin, deleteProduct);

// PATCH /api/products/:id/visibility — toggle hide/show
router.patch('/:id/visibility', authAdmin, toggleVisibility);

// PATCH /api/products/:id/featured — toggle featured status
router.patch('/:id/featured', authAdmin, toggleFeatured);

module.exports = router;
