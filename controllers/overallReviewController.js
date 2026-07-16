const OverallReview = require('../models/OverallReview');
const { getLocalDB, saveLocalDB, isMongoDBConnected } = require('../utils/localDbHelper');
const { uploadBufferToCloudinary } = require('../services/cloudinaryService');
const { deleteCloudinaryImage } = require('../utils/deleteCloudinaryImage');

// Helper to generate IDs for local JSON fallback DB
const generateId = () => 'rev-' + Math.random().toString(36).substr(2, 9);

// POST /api/reviews/overall
const createOverallReview = async (req, res) => {
  const { name, email, rating, review } = req.body;

  // Validation
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!review || review.trim() === '') {
    return res.status(400).json({ error: 'Review text is required' });
  }
  
  const parsedRating = parseInt(rating, 10);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const uploadedImages = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadBufferToCloudinary(file.buffer, file.mimetype, 'DreamyCrochet05/reviews/overall');
        uploadedImages.push(result); // result is { url, public_id }
      }
    }

    const reviewData = {
      name: name.trim(),
      email: email ? email.trim() : '',
      rating: parsedRating,
      review: review.trim(),
      images: uploadedImages,
      status: 'pending'
    };

    if (isMongoDBConnected()) {
      const newReview = new OverallReview(reviewData);
      await newReview.save();
      return res.status(201).json(newReview);
    } else {
      const db = getLocalDB();
      if (!db.overallReviews) {
        db.overallReviews = [];
      }
      
      const newLocalReview = {
        _id: generateId(),
        id: generateId(),
        ...reviewData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.overallReviews.push(newLocalReview);
      saveLocalDB();
      return res.status(201).json(newLocalReview);
    }
  } catch (err) {
    console.error('❌ Error creating overall review:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit review' });
  }
};

// GET /api/reviews/overall
const getApprovedOverallReviews = async (req, res) => {
  try {
    if (isMongoDBConnected()) {
      const reviews = await OverallReview.find({ status: 'approved' }).sort({ createdAt: -1 });
      return res.json(reviews);
    } else {
      const db = getLocalDB();
      const reviews = db.overallReviews || [];
      const approved = reviews.filter(r => r.status === 'approved');
      // Sort descending by date
      approved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(approved);
    }
  } catch (err) {
    console.error('❌ Error fetching overall reviews:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch reviews' });
  }
};

// GET /api/reviews/overall/admin/pending (Admin only)
const getPendingOverallReviews = async (req, res) => {
  try {
    if (isMongoDBConnected()) {
      const reviews = await OverallReview.find({ status: 'pending' }).sort({ createdAt: -1 });
      return res.json(reviews);
    } else {
      const db = getLocalDB();
      const reviews = db.overallReviews || [];
      const pending = reviews.filter(r => r.status === 'pending');
      pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(pending);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/reviews/overall/admin/approved (Admin only)
const getApprovedOverallReviewsAdmin = async (req, res) => {
  try {
    if (isMongoDBConnected()) {
      const reviews = await OverallReview.find({ status: 'approved' }).sort({ createdAt: -1 });
      return res.json(reviews);
    } else {
      const db = getLocalDB();
      const reviews = db.overallReviews || [];
      const approved = reviews.filter(r => r.status === 'approved');
      approved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(approved);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// PATCH /api/reviews/overall/admin/:id/approve (Admin only)
const approveOverallReview = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoDBConnected()) {
      const review = await OverallReview.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
      if (!review) return res.status(404).json({ error: 'Review not found' });
      return res.json(review);
    } else {
      const db = getLocalDB();
      const reviews = db.overallReviews || [];
      const review = reviews.find(r => r._id === id || r.id === id);
      if (!review) return res.status(404).json({ error: 'Review not found' });
      review.status = 'approved';
      review.updatedAt = new Date().toISOString();
      saveLocalDB();
      return res.json(review);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// PATCH /api/reviews/overall/admin/:id/reject (Admin only)
const rejectOverallReview = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoDBConnected()) {
      const review = await OverallReview.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
      if (!review) return res.status(404).json({ error: 'Review not found' });
      return res.json(review);
    } else {
      const db = getLocalDB();
      const reviews = db.overallReviews || [];
      const review = reviews.find(r => r._id === id || r.id === id);
      if (!review) return res.status(404).json({ error: 'Review not found' });
      review.status = 'rejected';
      review.updatedAt = new Date().toISOString();
      saveLocalDB();
      return res.json(review);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /api/reviews/overall/admin/:id (Admin only)
const deleteOverallReview = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoDBConnected()) {
      const review = await OverallReview.findById(id);
      if (!review) return res.status(404).json({ error: 'Review not found' });
      
      // Delete images from Cloudinary
      if (review.images && review.images.length > 0) {
        for (const img of review.images) {
          await deleteCloudinaryImage(img);
        }
      }
      
      await OverallReview.findByIdAndDelete(id);
      return res.json({ message: 'Review deleted successfully' });
    } else {
      const db = getLocalDB();
      const reviews = db.overallReviews || [];
      const index = reviews.findIndex(r => r._id === id || r.id === id);
      if (index === -1) return res.status(404).json({ error: 'Review not found' });
      
      const review = reviews[index];
      // Delete images from local fallback uploads or Cloudinary
      if (review.images && review.images.length > 0) {
        for (const img of review.images) {
          await deleteCloudinaryImage(img);
        }
      }
      
      reviews.splice(index, 1);
      saveLocalDB();
      return res.json({ message: 'Review deleted successfully' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createOverallReview,
  getApprovedOverallReviews,
  getPendingOverallReviews,
  getApprovedOverallReviewsAdmin,
  approveOverallReview,
  rejectOverallReview,
  deleteOverallReview
};
