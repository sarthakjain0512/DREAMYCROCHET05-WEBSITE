// models/CustomOrder.js
// ─────────────────────────────────────────────────────────────────────────────
// DreamyCrochet05 — Custom Order Inquiry Model
// Stores all customer crochet inquiry form submissions.
//
// ⭐ Cloudinary-Ready:
//   referenceImages stores local /uploads/orders/ paths now.
//   When you switch to Cloudinary, just change the paths to Cloudinary URLs.
//   The frontend code stays identical.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const customOrderSchema = new mongoose.Schema(
  {
    // ── Customer Information ──────────────────────────────────────────────────
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    instagramUsername: {
      type: String,
      default: '',
      trim: true
    },

    // ── Order Details ─────────────────────────────────────────────────────────
    occasion: {
      type: String,
      required: [true, 'Occasion is required'],
      trim: true,
      enum: [
        'Birthday',
        'Anniversary',
        'Graduation',
        'Friendship',
        "Mother's Day",
        "Valentine's Day",
        'Room Decor',
        'Baby Shower',
        'Proposal',
        'Custom Gift',
        'Other'
      ]
    },
    message: {
      type: String,
      required: [true, 'Message / description is required'],
      trim: true
    },

    // ── Reference Images (Array — supports up to 5 files) ────────────────────
    referenceImages: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },

    // ── Order Status Workflow ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Accepted', 'Making', 'Ready', 'Completed'],
      default: 'New'
    }
  },
  {
    // Automatic createdAt + updatedAt timestamps
    timestamps: true
  }
);

module.exports = mongoose.model('CustomOrder', customOrderSchema);
