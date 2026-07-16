const express = require('express');
const router = express.Router();
const {
  createProductReview,
  getApprovedProductReviews,
  getPendingProductReviews,
  getApprovedProductReviewsAdmin,
  approveProductReview,
  rejectProductReview,
  deleteProductReview
} = require('../controllers/productReviewController');
const authAdmin = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadCloudinary');

// Public routes
router.post('/product', upload.array('images', 5), createProductReview);
router.get('/product/:productId', getApprovedProductReviews);

// Admin routes
router.get('/product/admin/pending', authAdmin, getPendingProductReviews);
router.get('/product/admin/approved', authAdmin, getApprovedProductReviewsAdmin);
router.patch('/product/admin/:id/approve', authAdmin, approveProductReview);
router.patch('/product/admin/:id/reject', authAdmin, rejectProductReview);
router.delete('/product/admin/:id', authAdmin, deleteProductReview);

module.exports = router;
