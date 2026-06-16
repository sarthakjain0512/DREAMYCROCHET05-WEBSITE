// routes/customOrderRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// DreamyCrochet05 — Custom Order Inquiry API Routes
//
// Base path: /api/custom-orders (mounted in server.js)
//
// Public routes:
//   POST   /              — Submit new inquiry (customer form + image upload)
//
// Admin-protected routes (require JWT in Authorization header):
//   GET    /              — List all inquiries
//   GET    /stats         — Analytics: total, by status, most popular occasion
//   GET    /:id           — Single inquiry detail
//   PATCH  /:id/status    — Update status (New → Contacted → Accepted → ...)
//   DELETE /:id           — Delete inquiry + cleanup image files
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

// ── Import Controller ────────────────────────────────────────────────────────
const {
  submitCustomOrder,
  getCustomOrders,
  getCustomOrderStats,
  getCustomOrderById,
  updateCustomOrderStatus,
  deleteCustomOrder
} = require('../controllers/customOrderController');

// ── Import Middleware ────────────────────────────────────────────────────────
const validateCustomOrder = require('../middleware/validateCustomOrder');
const { uploadCustomOrderImages } = require('../middleware/uploadCloudinary');
const authAdmin = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/custom-orders
// Apply rate limiting (max 5 requests per minute) and validation before upload
router.post(
  '/',
  (req, res, next) => {
    console.log("🔥 ROUTE HIT");
    next();
  },
  rateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: 'Too many order submissions, please try later.'
  }),
  uploadCustomOrderImages,
  validateCustomOrder,
  submitCustomOrder
);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN-ONLY ROUTES (Protected by JWT middleware)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/custom-orders/stats (must be before /:id to avoid conflict)
router.get('/stats', authAdmin, getCustomOrderStats);

// GET /api/custom-orders
router.get('/', authAdmin, getCustomOrders);

// GET /api/custom-orders/:id
router.get('/:id', authAdmin, getCustomOrderById);

// PATCH /api/custom-orders/:id/status
router.patch('/:id/status', authAdmin, updateCustomOrderStatus);

// DELETE /api/custom-orders/:id
router.delete('/:id', authAdmin, deleteCustomOrder);

module.exports = router;
