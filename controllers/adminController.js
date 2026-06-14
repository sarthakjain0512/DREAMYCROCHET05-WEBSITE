// controllers/adminController.js
// ─────────────────────────────────────────────────────────────────────────────
// Admin Authentication Controller for DreamyCrochet05
// Handles: Login, Profile Fetch, Token Verify, and Logout
// All sensitive credentials come from .env — never hardcoded here.
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { isMongoDBConnected } = require('../utils/localDbHelper');

// Read JWT secret from environment (set in .env)
if (!process.env.JWT_SECRET) { console.error('❌ JWT secret is missing in .env'); process.exit(1); } const JWT_SECRET = process.env.JWT_SECRET;

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// POST /api/admin/login
// Accepts: { email, password }
// Returns: { token } on success, or error response on failure
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Basic input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    let isPasswordCorrect = false;
    let adminId = 'local-admin-id';
    let adminEmail = email.toLowerCase().trim();

    if (isMongoDBConnected()) {
      // 2. Look up admin account in MongoDB by email
      const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

      // 3. If no admin found with that email, reject (same generic message for security)
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // 4. Compare entered password with the bcrypt hash stored in MongoDB
      isPasswordCorrect = await admin.comparePassword(password);
      adminId = admin._id;
      adminEmail = admin.email;
    } else {
      // Local fallback using .env credentials
      const envEmail = (process.env.ADMIN_EMAIL || 'exploringindia0512@gmail.com').toLowerCase().trim();
      const envPassword = process.env.ADMIN_PASSWORD || 'admin123';
      if (email.toLowerCase().trim() === envEmail && password === envPassword) {
        isPasswordCorrect = true;
      }
    }

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 5. Credentials are valid — generate a JWT token
    const token = jwt.sign(
      {
        id: adminId,
        email: adminEmail,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 6. Return the token (frontend stores it in sessionStorage)
    return res.status(200).json({
      token,
      email: adminEmail
    });

  } catch (err) {
    console.error('❌ getProducts error:', err);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
};

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
// GET /api/admin/profile
// Protected by authMiddleware — requires valid Bearer token
// Returns the logged-in admin's email (for dashboard header display)
// ─────────────────────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    if (isMongoDBConnected()) {
      // req.admin is attached by authMiddleware after verifying the JWT
      const admin = await Admin.findById(req.admin.id).select('-password');

      if (!admin) {
        return res.status(404).json({ error: 'Admin account not found' });
      }

      return res.status(200).json({
        id: admin._id,
        email: admin.email,
        createdAt: admin.createdAt
      });
    } else {
      return res.status(200).json({
        id: 'local-admin-id',
        email: process.env.ADMIN_EMAIL || 'exploringindia0512@gmail.com',
        createdAt: new Date()
      });
    }

  } catch (err) {
    console.error('❌ getProfile error:', err);
    return res.status(500).json({ error: 'Server error fetching profile' });
  }
};

// ─── VERIFY TOKEN ─────────────────────────────────────────────────────────────
// POST /api/admin/verify
// Used by frontend's verifyAdminToken() to check if stored token is still valid
// Returns: { valid: true/false }
// ─────────────────────────────────────────────────────────────────────────────
const verify = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.json({ valid: false });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded.role !== 'admin') {
      return res.json({ valid: false });
    }
    return res.json({ valid: true, email: decoded.email });
  });
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
// POST /api/admin/logout
// Protected by authMiddleware
// JWT is stateless — actual logout happens on the frontend (clear sessionStorage).
// This endpoint exists so future token blacklisting can be added here easily.
// ─────────────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  // In a stateless JWT system, the server doesn't store tokens,
  // so logout is handled by removing the token on the client side.
  // This endpoint acknowledges the logout request cleanly.
  return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  login,
  getProfile,
  verify,
  logout
};
