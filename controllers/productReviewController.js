const ProductReview = require('../models/ProductReview');
const Product = require('../models/Product');
const { getLocalDB, saveLocalDB, isMongoDBConnected } = require('../utils/localDbHelper');
const { uploadBufferToCloudinary } = require('../services/cloudinaryService');
const { deleteCloudinaryImage } = require('../utils/deleteCloudinaryImage');

const generateId = () => 'rev-p-' + Math.random().toString(36).substr(2, 9);

// POST /api/reviews/product
const createProductReview = async (req, res) => {
  const { productId, name, email, rating, review } = req.body;

  // Validation
  if (!productId || productId.trim() === '') {
    return res.status(400).json({ error: 'Product ID is required' });
  }
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
    let productTitle = '';
    // Verify product exists and get its title
    if (isMongoDBConnected()) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      productTitle = product.title || product.name;
    } else {
      const db = getLocalDB();
      const products = db.products || [];
      const product = products.find(p => p._id === productId || p.id === productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      productTitle = product.title || product.name;
    }

    const uploadedImages = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadBufferToCloudinary(file.buffer, file.mimetype, 'DreamyCrochet05/reviews/products');
        uploadedImages.push(result);
      }
    }

    const reviewData = {
      productId,
      productTitle,
      name: name.trim(),
      email: email ? email.trim() : '',
      rating: parsedRating,
      review: review.trim(),
      images: uploadedImages,
      status: 'pending'
    };

    if (isMongoDBConnected()) {
      const newReview = new ProductReview(reviewData);
      await newReview.save();
      return res.status(201).json(newReview);
    } else {
      const db = getLocalDB();
      if (!db.productReviews) {
        db.productReviews = [];
      }

      const newLocalReview = {
        _id: generateId(),
        id: generateId(),
        ...reviewData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.productReviews.push(newLocalReview);
      saveLocalDB();
      return res.status(201).json(newLocalReview);
    }
  } catch (err) {
    console.error('❌ Error creating product review:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit review' });
  }
};

// GET /api/reviews/product/:productId
const getApprovedProductReviews = async (req, res) => {
  const { productId } = req.params;
  try {
    if (isMongoDBConnected()) {
      const reviews = await ProductReview.find({ productId, status: 'approved' }).sort({ createdAt: -1 });
      return res.json(reviews);
    } else {
      const db = getLocalDB();
      const reviews = db.productReviews || [];
      const approved = reviews.filter(r => r.productId === productId && r.status === 'approved');
      approved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(approved);
    }
  } catch (err) {
    console.error('❌ Error fetching product reviews:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch reviews' });
  }
};

// GET /api/reviews/product/admin/pending (Admin only)
const getPendingProductReviews = async (req, res) => {
  try {
    if (isMongoDBConnected()) {
      const reviews = await ProductReview.find({ status: 'pending' }).sort({ createdAt: -1 });
      return res.json(reviews);
    } else {
      const db = getLocalDB();
      const reviews = db.productReviews || [];
      const pending = reviews.filter(r => r.status === 'pending');
      pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(pending);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/reviews/product/admin/approved (Admin only)
const getApprovedProductReviewsAdmin = async (req, res) => {
  try {
    if (isMongoDBConnected()) {
      const reviews = await ProductReview.find({ status: 'approved' }).sort({ createdAt: -1 });
      return res.json(reviews);
    } else {
      const db = getLocalDB();
      const reviews = db.productReviews || [];
      const approved = reviews.filter(r => r.status === 'approved');
      approved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(approved);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// PATCH /api/reviews/product/admin/:id/approve (Admin only)
const approveProductReview = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoDBConnected()) {
      const review = await ProductReview.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
      if (!review) return res.status(404).json({ error: 'Review not found' });
      return res.json(review);
    } else {
      const db = getLocalDB();
      const reviews = db.productReviews || [];
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

// PATCH /api/reviews/product/admin/:id/reject (Admin only)
const rejectProductReview = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoDBConnected()) {
      const review = await ProductReview.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
      if (!review) return res.status(404).json({ error: 'Review not found' });
      return res.json(review);
    } else {
      const db = getLocalDB();
      const reviews = db.productReviews || [];
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

// DELETE /api/reviews/product/admin/:id (Admin only)
const deleteProductReview = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoDBConnected()) {
      const review = await ProductReview.findById(id);
      if (!review) return res.status(404).json({ error: 'Review not found' });

      // Delete images from Cloudinary
      if (review.images && review.images.length > 0) {
        for (const img of review.images) {
          await deleteCloudinaryImage(img);
        }
      }

      await ProductReview.findByIdAndDelete(id);
      return res.json({ message: 'Review deleted successfully' });
    } else {
      const db = getLocalDB();
      const reviews = db.productReviews || [];
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
  createProductReview,
  getApprovedProductReviews,
  getPendingProductReviews,
  getApprovedProductReviewsAdmin,
  approveProductReview,
  rejectProductReview,
  deleteProductReview
};
