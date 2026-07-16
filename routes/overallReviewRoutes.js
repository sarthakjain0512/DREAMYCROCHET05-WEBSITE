const express = require('express');
const router = express.Router();
const {
  createOverallReview,
  getApprovedOverallReviews,
  getPendingOverallReviews,
  getApprovedOverallReviewsAdmin,
  approveOverallReview,
  rejectOverallReview,
  deleteOverallReview
} = require('../controllers/overallReviewController');
const authAdmin = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadCloudinary');

// Public routes
router.post('/overall', upload.array('images', 5), createOverallReview);
router.get('/overall', getApprovedOverallReviews);

// Admin routes
router.get('/overall/admin/pending', authAdmin, getPendingOverallReviews);
router.get('/overall/admin/approved', authAdmin, getApprovedOverallReviewsAdmin);
router.patch('/overall/admin/:id/approve', authAdmin, approveOverallReview);
router.patch('/overall/admin/:id/reject', authAdmin, rejectOverallReview);
router.delete('/overall/admin/:id', authAdmin, deleteOverallReview);

module.exports = router;
