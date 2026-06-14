// middleware/uploadCustomOrder.js
// ─────────────────────────────────────────────────────────────────────────────
// Multer Upload Middleware for Custom Order Inspiration Photos
//
// Supports up to 5 images per inquiry.
// Accepted formats: jpg, jpeg, png, webp
// Max file size: 10MB each
//
// ⭐ CLOUDINARY MIGRATION NOTE:
//   To switch to Cloudinary later, replace diskStorage with multer-storage-cloudinary.
//   The controller (customOrderController.js) code needs NO changes.
//   The frontend form code needs NO changes.
//   Only this file needs to change!
// ─────────────────────────────────────────────────────────────────────────────

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Ensure uploads/orders directory exists ──────────────────────────────────
const ORDERS_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'orders');
if (!fs.existsSync(ORDERS_UPLOAD_DIR)) {
  fs.mkdirSync(ORDERS_UPLOAD_DIR, { recursive: true });
  console.log('📁 Created uploads/orders directory for custom order reference photos.');
}

// ─── Storage Configuration ────────────────────────────────────────────────────
// Saves files to /uploads/orders/ with a timestamp-based unique filename.
// Example: order-1718000000000-987654321.jpg
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ORDERS_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `order-${uniqueSuffix}${ext}`);
  }
});

// ─── File Filter ──────────────────────────────────────────────────────────────
// Only accept jpg, jpeg, png, webp images.
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // Accept
  } else {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed for reference photos.'), false);
  }
};

// ─── Multer Instance ──────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5                     // Maximum 5 reference images per inquiry
  }
});

// ─── Export the multi-file upload middleware ──────────────────────────────────
// 'referenceImages' must match the form field name in the frontend.
// Usage in routes: router.post('/', uploadCustomOrderImages, submitCustomOrder)
const uploadCustomOrderImages = upload.array('referenceImages', 5);

module.exports = uploadCustomOrderImages;
