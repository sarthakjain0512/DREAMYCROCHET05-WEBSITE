// middleware/uploadCloudinary.js
// ─────────────────────────────────────────────────────────────────────────────
// Multer Memory Storage Middleware for DreamyCrochet05
// Saves uploaded files directly in memory buffers to upload to Cloudinary.
// ─────────────────────────────────────────────────────────────────────────────

const multer = require('multer');

// Memory storage keeps files as buffer in req.file / req.files
const storage = multer.memoryStorage();

// Accept only standard image formats: jpeg, jpg, png, webp
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  }
});

// Single image upload for products cover (limit to 1 file)
const uploadProductImage = upload.single('image');

// Multiple image upload for custom orders (limit to 5 files)
const uploadCustomOrderImages = upload.array('referenceImages', 5);

module.exports = {
  upload,
  uploadProductImage,
  uploadCustomOrderImages
};
