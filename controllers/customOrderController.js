// controllers/customOrderController.js
// ─────────────────────────────────────────────────────────────────────────────
// DreamyCrochet05 — Custom Order Inquiry Controller (MVC Architecture)
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs = require('fs');
const CustomOrder = require('../models/CustomOrder');
const { sendInquiryEmail } = require('../services/emailService');
const { getLocalDB, saveLocalDB, isMongoDBConnected } = require('../utils/localDbHelper');
const { uploadBufferToCloudinary } = require('../services/cloudinaryService');
const { deleteCloudinaryImage } = require('../utils/deleteCloudinaryImage');

// ─── Helper: Map DB/JSON object → clean frontend object ──────────────────────
const getUrl = (val) => {
  if (val && typeof val === 'object' && val.url) return val.url;
  return val || '';
};

const mapOrder = (doc) => {
  const referenceImagesMapped = (doc.referenceImages || []).map(img => getUrl(img));
  
  return {
    id: doc._id || doc.id,
    customerName: doc.customerName,
    email: doc.email,
    phone: doc.phone,
    instagramUsername: doc.instagramUsername || '',
    occasion: doc.occasion,
    message: doc.message,
    referenceImages: referenceImagesMapped,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

const VALID_STATUSES = ['New', 'Contacted', 'Accepted', 'Making', 'Ready', 'Completed'];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/custom-orders
// Public endpoint — allows customers to submit inquiry with inspiration images.
// ─────────────────────────────────────────────────────────────────────────────
const submitCustomOrder = async (req, res) => {
  console.log("========== CUSTOM ORDER ==========");
console.log("BODY:", req.body);
console.log("FILES:", req.files);
console.log("==================================");
  const uploadedCloudinaryImages = [];
  try {
    const { customerName, email, phone, instagramUsername, occasion, message } = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!customerName || !email || !phone || !occasion || !message) {
      return res.status(400).json({
        error: 'Missing required fields: customerName, email, phone, occasion, message'
      });
    }

    // Enforce max 5 reference images
    const uploadedFiles = req.files || [];
    if (uploadedFiles.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 reference images are allowed.' });
    }

    // Validate size and mimetype for each memory buffer
    for (const file of uploadedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'Each image must be under 10MB.' });
      }
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WEBP images are allowed.' });
      }
    }

    // ── Upload memory buffers to Cloudinary ──
    for (const file of uploadedFiles) {
      const result = await uploadBufferToCloudinary(file.buffer, file.mimetype, 'DreamyCrochet05/custom-orders');
      uploadedCloudinaryImages.push(result); // result is { url, public_id }
    }

    let newOrder;
    try {
      // ── Save to MongoDB or local JSON ─────────────────────────────────────────
      if (isMongoDBConnected()) {
        newOrder = new CustomOrder({
          customerName: customerName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          instagramUsername: (instagramUsername || '').trim(),
          occasion: occasion.trim(),
          message: message.trim(),
          referenceImages: uploadedCloudinaryImages,
          status: 'New'
        });
        await newOrder.save();
      } else {
        const db = getLocalDB();
        if (!db.customOrders) {
          db.customOrders = [];
        }
        newOrder = {
          id: 'cust-order-' + Date.now(),
          customerName: customerName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          instagramUsername: (instagramUsername || '').trim(),
          occasion: occasion.trim(),
          message: message.trim(),
          referenceImages: uploadedCloudinaryImages,
          status: 'New',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.customOrders.push(newOrder);
        saveLocalDB();
      }
    } catch (dbError) {
      // ── Consistency Rollback: If MongoDB/local DB save fails, delete uploaded assets from Cloudinary ──
      console.error('❌ Database save failed. Rolling back Cloudinary uploads...', dbError.message);
      for (const img of uploadedCloudinaryImages) {
        await deleteCloudinaryImage(img);
      }
      throw dbError;
    }

    console.log(`✅ New custom order inquiry saved: ${newOrder._id || newOrder.id} from ${newOrder.customerName}`);

    // ── Send email notification to admin ──────────────────────────────────────
    // Passes the mapped plain urls to the email service
    const mappedOrder = mapOrder(newOrder);
    try {
  await sendInquiryEmail(mappedOrder, mappedOrder.referenceImages);
  console.log("✅ sendInquiryEmail() finished");
} catch (err) {
  console.error("❌ sendInquiryEmail() failed:", err);
}
    return res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully! We will contact you within 24 hours.',
      order: mappedOrder
    });

  } catch (err) {
    console.error('❌ Error submitting custom order:', err);
    return res.status(500).json({ error: err.message || 'Server error. Please try again later.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/custom-orders
// Admin-only — returns all inquiries, newest first.
// ─────────────────────────────────────────────────────────────────────────────
const getCustomOrders = async (req, res) => {
  try {
    if (isMongoDBConnected()) {
      const orders = await CustomOrder.find({}).sort({ createdAt: -1 });
      return res.json(orders.map(mapOrder));
    } else {
      const db = getLocalDB();
      const customOrders = db.customOrders || [];
      const ordersCopy = [...customOrders].reverse();
      return res.json(ordersCopy.map(mapOrder));
    }
  } catch (err) {
    console.error('❌ Error fetching custom orders:', err);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/custom-orders/stats
// Admin-only — returns aggregated analytics for the dashboard.
// ─────────────────────────────────────────────────────────────────────────────
const getCustomOrderStats = async (req, res) => {
  try {
    let allOrders = [];
    if (isMongoDBConnected()) {
      allOrders = await CustomOrder.find({});
    } else {
      const db = getLocalDB();
      allOrders = db.customOrders || [];
    }
    const total = allOrders.length;

    const statusCounts = {
      New: 0, Contacted: 0, Accepted: 0, Making: 0, Ready: 0, Completed: 0
    };
    allOrders.forEach(o => {
      if (statusCounts.hasOwnProperty(o.status)) {
        statusCounts[o.status]++;
      }
    });

    const occasionMap = {};
    allOrders.forEach(o => {
      occasionMap[o.occasion] = (occasionMap[o.occasion] || 0) + 1;
    });
    const mostRequestedOccasion = Object.entries(occasionMap)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = allOrders.filter(o => new Date(o.createdAt || o.date) >= thisMonthStart).length;

    return res.json({
      total,
      statusCounts,
      mostRequestedOccasion,
      thisMonthCount
    });
  } catch (err) {
    console.error('❌ Error fetching stats:', err);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/custom-orders/:id
// Admin-only — returns full detail for a single inquiry.
// ─────────────────────────────────────────────────────────────────────────────
const getCustomOrderById = async (req, res) => {
  try {
    if (isMongoDBConnected()) {
      const order = await CustomOrder.findById(req.params.id);
      if (!order) return res.status(404).json({ error: 'Inquiry not found.' });
      return res.json(mapOrder(order));
    } else {
      const db = getLocalDB();
      const customOrders = db.customOrders || [];
      const order = customOrders.find(o => o.id === req.params.id || o._id === req.params.id);
      if (!order) return res.status(404).json({ error: 'Inquiry not found.' });
      return res.json(mapOrder(order));
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/custom-orders/:id/status
// Admin-only — updates the status of an inquiry (instant update).
// ─────────────────────────────────────────────────────────────────────────────
const updateCustomOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    let order;
    if (isMongoDBConnected()) {
      order = await CustomOrder.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      );
      if (!order) return res.status(404).json({ error: 'Inquiry not found.' });
    } else {
      const db = getLocalDB();
      const customOrders = db.customOrders || [];
      const idx = customOrders.findIndex(o => o.id === req.params.id || o._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Inquiry not found.' });
      customOrders[idx].status = status;
      customOrders[idx].updatedAt = new Date().toISOString();
      order = customOrders[idx];
      saveLocalDB();
    }

    console.log(`📋 Order ${order._id || order.id} status updated to: ${status}`);
    return res.json(mapOrder(order));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/custom-orders/:id
// Admin-only — deletes the inquiry and its associated images.
// ─────────────────────────────────────────────────────────────────────────────
const deleteCustomOrder = async (req, res) => {
  try {
    let order;
    if (isMongoDBConnected()) {
      order = await CustomOrder.findByIdAndDelete(req.params.id);
      if (!order) return res.status(404).json({ error: 'Inquiry not found.' });
    } else {
      const db = getLocalDB();
      const customOrders = db.customOrders || [];
      const idx = customOrders.findIndex(o => o.id === req.params.id || o._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Inquiry not found.' });
      order = customOrders[idx];
      customOrders.splice(idx, 1);
      saveLocalDB();
    }

    // ── Delete associated reference images from Cloudinary (or local falls) ──
    if (order.referenceImages && order.referenceImages.length > 0) {
      for (const imageVal of order.referenceImages) {
        if (imageVal && typeof imageVal === 'object' && imageVal.public_id) {
          // Cloudinary delete
          await deleteCloudinaryImage(imageVal);
        } else if (typeof imageVal === 'string' && imageVal.startsWith('/uploads/')) {
          // Local fallback delete
          const absPath = path.join(__dirname, '..', imageVal);
          if (fs.existsSync(absPath)) {
            try {
              fs.unlinkSync(absPath);
            } catch (err) {
              console.error(`Failed to delete local file ${absPath}:`, err.message);
            }
          }
        } else if (typeof imageVal === 'string') {
          // Fallback delete if it's a Cloudinary URL string
          await deleteCloudinaryImage(imageVal);
        }
      }
    }

    console.log(`🗑️  Deleted custom order inquiry: ${order._id || order.id} from ${order.customerName}`);
    return res.json({ success: true, message: 'Inquiry deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  submitCustomOrder,
  getCustomOrders,
  getCustomOrderStats,
  getCustomOrderById,
  updateCustomOrderStatus,
  deleteCustomOrder
};
