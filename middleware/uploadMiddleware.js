// middleware/uploadMiddleware.js
// ─────────────────────────────────────────────────────────────────────────────
// Multer Upload Middleware for DreamyCrochet05
// Currently saves files locally to /uploads/products/
//
// ⭐ MILESTONE 4 COMPATIBILITY:
// To switch to Cloudinary, simply replace diskStorage with multer-storage-cloudinary
// The rest of the controller code stays exactly the same.
// ─────────────────────────────────────────────────────────────────────────────

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Ensure uploads/products directory exists ─────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ─── Storage Configuration ────────────────────────────────────────────────────
// Saves files to /uploads/products/ with timestamp-based filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: product-1718000000000-originalname.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

// ─── File Filter ──────────────────────────────────────────────────────────────
// Only accept image files (JPEG, PNG, WEBP, GIF)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed'), false);
  }
};

// ─── Multer Upload Instance ───────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// ─── Export single file upload middleware ─────────────────────────────────────
// Usage in routes: router.post('/', authAdmin, uploadProductImage, addProduct)
const uploadProductImage = upload.single('image'); // 'image' must match form field name

module.exports = uploadProductImage;
