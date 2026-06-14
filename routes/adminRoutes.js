// routes/adminRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Admin API Routes for DreamyCrochet05
// Base path: /api/admin (mounted in server.js)
//
// Public routes (no token required):
//   POST  /api/admin/login   → Authenticate with email + password
//   POST  /api/admin/verify  → Verify if existing JWT token is still valid
//
// Protected routes (require valid Bearer JWT token via authMiddleware):
//   GET   /api/admin/profile → Get logged-in admin details (for dashboard)
//   POST  /api/admin/logout  → Acknowledge logout (client clears token)
//
// Future-ready: Add product/order admin routes here in Milestone 3+
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

// Import controller functions
const { login, getProfile, verify, logout } = require('../controllers/adminController');
const validateAdminLogin = require('../middleware/validateAdminLogin');

// Import auth middleware (JWT verification guard)
const authAdmin = require('../middleware/authMiddleware');
// Import rate limiter middleware
const rateLimiter = require('../middleware/rateLimiter');

// ── PUBLIC ROUTES (no authentication required) ──────────────────────────────

// Login: POST /api/admin/login
// Body: { email: string, password: string }
// Returns: { token: string, email: string }
router.post(
  '/login',
  rateLimiter({ windowMs: 60 * 1000, maxRequests: 5, message: 'Too many login attempts, please try later.' }),
  validateAdminLogin,
  login
);

// Verify: POST /api/admin/verify
// Header: Authorization: Bearer <token>
// Returns: { valid: boolean, email?: string }
router.post('/verify', verify);

// ── PROTECTED ROUTES (JWT required) ─────────────────────────────────────────

// Profile: GET /api/admin/profile
// Header: Authorization: Bearer <token>
// Returns: { id, email, createdAt }
router.get('/profile', authAdmin, getProfile);

// Logout: POST /api/admin/logout
// Header: Authorization: Bearer <token>
// Returns: { message: 'Logged out successfully' }
router.post('/logout', authAdmin, logout);

module.exports = router;
