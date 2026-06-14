// routes/statusRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// /api/status – Health check endpoint protected by admin JWT middleware
// Returns health flags for MongoDB, Cloudinary, Email service, and server status.
// Includes version and environment fields.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

const authAdmin = require('../middleware/authMiddleware');
const { isMongoDBConnected } = require('../utils/localDbHelper');
const { isConfigured: cloudinaryConfigured } = require('../config/cloudinary');
const emailService = require('../services/emailService');

// Determine if email (Nodemailer) is enabled – emailService sets emailEnabled via env vars
let emailEnabled = false;
if (process.env.EMAIL && process.env.EMAIL_PASSWORD && !process.env.EMAIL.includes('your_email')) {
  emailEnabled = true;
}

// Load version from package.json (relative to project root)
let version = 'unknown';
try {
  const pkg = require('../package.json');
  version = pkg.version || version;
} catch (e) {
  // ignore if package.json cannot be read
}

router.get('/', authAdmin, (req, res) => {
  const health = {
    mongodb: isMongoDBConnected(),
    cloudinary: !!cloudinaryConfigured,
    email: emailEnabled,
    server: true,
    version,
    environment: process.env.NODE_ENV || 'development'
  };

// Always return HTTP 200 for health status; individual service flags indicate their own health
    res.status(200).json(health);
});

module.exports = router;
