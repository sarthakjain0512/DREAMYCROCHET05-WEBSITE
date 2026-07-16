const mongoose = require('mongoose');

const overallReviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    review: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true
    },
    images: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('OverallReview', overallReviewSchema);
