// middleware/authMiddleware.js
// ─────────────────────────────────────────────────────────────────────────────
// JWT Authentication Guard for DreamyCrochet05 Admin Routes
// Protects any route it is applied to — only verified admin tokens pass through.
//
// Usage in routes:
//   router.get('/profile', authAdmin, getProfile);
//
// On success: attaches req.admin = { id, email, role } and calls next()
// On failure: returns 401 or 403 JSON error immediately
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');

// Read JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'dreamy_crochet_secure_fallback_2026';

const authAdmin = (req, res, next) => {
  // 1. Extract the token from the Authorization header
  //    Expected format: "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 2. Reject if no token was provided
  if (!token) {
    return res.status(401).json({
      error: 'Access denied. No authentication token provided.'
    });
  }

  // 3. Verify the token signature and expiry using JWT_SECRET
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      // Token is invalid or expired
      return res.status(403).json({
        error: 'Access denied. Token is invalid or has expired.'
      });
    }

    // 4. Ensure the decoded payload has the 'admin' role
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        error: 'Access forbidden. Insufficient permissions.'
      });
    }

    // 5. Attach decoded admin info to request for use in controllers
    //    Controllers can now access: req.admin.id, req.admin.email, req.admin.role
    req.admin = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    // 6. All checks passed — proceed to the actual route handler
    next();
  });
};

module.exports = authAdmin;
