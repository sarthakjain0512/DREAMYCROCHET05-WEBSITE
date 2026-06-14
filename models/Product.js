// models/Product.js
// ─────────────────────────────────────────────────────────────────────────────
// Product Model for DreamyCrochet05
// This is a showcase/portfolio website — products are for browsing only.
// Customers contact via Instagram or WhatsApp, not checkout.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // ── Core Info ──────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    category: {
      type: String,
      enum: ['Crochet Flowers', 'Bouquet', 'Bouquets', 'Keychain', 'Keychains', 'Plushies', 'Amigurumi', 'Accessory', 'Flower Pots', 'Custom', 'Custom Gifts', 'Single Stem', 'Others'],
      default: 'Others'
    },

    price: {
      type: String,
      required: [true, 'Price is required'],
      default: 'Ask Us',
      trim: true
    },

    // ── Image ─────────────────────────────────────────────────────────────────
    image: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Product image is required']
    },

    images: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },

    coverImage: {
      type: mongoose.Schema.Types.Mixed,
      default: ''
    },

    // ── Display Options ────────────────────────────────────────────────────────
    // Small label badge shown on the product card image (e.g. "Best Seller", "New 🌸")
    label: {
      type: String,
      default: '',
      trim: true
    },

    // Featured products appear in the "Featured Collection" section on the homepage
    // Featured products always sort before regular ones
    featured: {
      type: Boolean,
      default: false
    },

    // ── Visibility Toggle ─────────────────────────────────────────────────────
    // Admin can hide/show products without deleting them
    // isVisible: false → hidden from visitors but stays in admin dashboard
    // Homepage fetches only isVisible: true products
    isVisible: {
      type: Boolean,
      default: true
    },

    // ── Social Links ──────────────────────────────────────────────────────────
    // Optional Instagram post link for this specific product
    instagramLink: {
      type: String,
      default: '',
      trim: true
    },

    // ── Analytics ─────────────────────────────────────────────────────────────
    // Increments every time a visitor opens the product Quick View modal
    // Used in "Most Viewed Products" dashboard widget
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    // Auto-manages createdAt and updatedAt timestamps in MongoDB
    timestamps: true
  }
);

// Pre-validate hook to sync image, coverImage, and images fields
productSchema.pre('validate', function (next) {
  if (this.images && this.images.length > 0) {
    if (!this.coverImage) {
      this.coverImage = this.images[0];
    }
    this.image = this.coverImage;
  } else if (this.image) {
    this.images = [this.image];
    this.coverImage = this.image;
  }
  next();
});

// ─── INDEXES ─────────────────────────────────────────────────────────────────
// Index title for faster duplicate checks
productSchema.index({ title: 1 });
// Index for homepage queries (visible only, featured first)
productSchema.index({ isVisible: 1, featured: -1, createdAt: -1 });
// Index for most viewed widget
productSchema.index({ viewCount: -1 });

module.exports = mongoose.model('Product', productSchema);
