// utils/deleteCloudinaryImage.js
// ─────────────────────────────────────────────────────────────────────────────
// DreamyCrochet05 — Safe Cloudinary Image Deletion Utility
// ─────────────────────────────────────────────────────────────────────────────

const { cloudinary, isConfigured } = require('../config/cloudinary');
const { getLocalDB, isMongoDBConnected } = require('./localDbHelper');
const { logCloudinaryAction } = require('../services/cloudinaryService');
const fs = require('fs');
const path = require('path');

/**
 * Parses and extracts public ID from a Cloudinary URL
 */
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  
  // Example: https://res.cloudinary.com/dwgznhwqo/image/upload/v1781326740/DreamyCrochet05/products/my_image.png
  const parts = url.split('/image/upload/');
  if (parts.length < 2) return null;
  
  let pathWithParams = parts[1];
  const firstSlash = pathWithParams.indexOf('/');
  
  // Remove version prefix (e.g. 'v1781326740/') if it exists
  if (pathWithParams.substring(0, firstSlash).startsWith('v') && !isNaN(pathWithParams.substring(1, firstSlash))) {
    pathWithParams = pathWithParams.substring(firstSlash + 1);
  }
  
  // Remove file extension
  const dotIndex = pathWithParams.lastIndexOf('.');
  if (dotIndex !== -1) {
    pathWithParams = pathWithParams.substring(0, dotIndex);
  }
  
  return pathWithParams; // e.g. "DreamyCrochet05/products/my_image"
};

/**
 * Checks if a public_id is referenced in any Product or CustomOrder document
 */
async function isImageReferenced(publicId) {
  if (isMongoDBConnected()) {
    const Product = require('../models/Product');
    const CustomOrder = require('../models/CustomOrder');
    
    // Check if any product references the public_id
    const productRef = await Product.findOne({
      $or: [
        { 'image.public_id': publicId },
        { 'coverImage.public_id': publicId },
        { 'images.public_id': publicId }
      ]
    });
    if (productRef) return true;

    // Check if any custom order references the public_id
    const orderRef = await CustomOrder.findOne({
      'referenceImages.public_id': publicId
    });
    if (orderRef) return true;
  } else {
    // Check local fallback JSON DB
    const db = getLocalDB();
    const products = db.products || [];
    const customOrders = db.customOrders || [];

    const getPId = (val) => {
      if (val && typeof val === 'object') return val.public_id;
      return null;
    };

    const hasProdRef = products.some(p => 
      getPId(p.image) === publicId || 
      getPId(p.coverImage) === publicId ||
      (Array.isArray(p.images) && p.images.some(img => getPId(img) === publicId))
    );
    if (hasProdRef) return true;

    const hasOrderRef = customOrders.some(o => 
      Array.isArray(o.referenceImages) && o.referenceImages.some(img => getPId(img) === publicId)
    );
    if (hasOrderRef) return true;
  }

  return false;
}

/**
 * Safely deletes an image from Cloudinary if no other documents reference it
 */
async function deleteCloudinaryImage(imageObjOrUrl) {
  let publicId = null;
  let url = '';

  if (imageObjOrUrl && typeof imageObjOrUrl === 'object') {
    publicId = imageObjOrUrl.public_id;
    url = imageObjOrUrl.url;
  } else if (typeof imageObjOrUrl === 'string') {
    url = imageObjOrUrl;
    publicId = getPublicIdFromUrl(imageObjOrUrl);
  }

  // Handle local fallback file deletion
  const checkUrl = url || publicId || '';
  if (typeof checkUrl === 'string' && checkUrl.startsWith('/uploads/')) {
    try {
      const referenced = await isImageReferenced(checkUrl);
      if (referenced) {
        console.log(`[Local Delete] Skipped deletion of referenced file: ${checkUrl}`);
        return false;
      }
      const absPath = path.join(__dirname, '..', checkUrl);
      if (fs.existsSync(absPath)) {
        fs.unlinkSync(absPath);
        console.log(`🗑️  Deleted local fallback file: ${absPath}`);
        return true;
      }
    } catch (err) {
      console.error(`❌ Failed to delete local file ${checkUrl}:`, err.message);
      return false;
    }
  }

  if (!isConfigured) {
    return false;
  }

  if (!publicId) {
    return false;
  }

  try {
    // ── Safe Delete Logic: Check for shared references ──
    const referenced = await isImageReferenced(publicId);
    if (referenced) {
      logCloudinaryAction('DELETE', 'SKIPPED_REFERENCED', {
        public_id: publicId,
        message: 'Image is still referenced by another product or inquiry.'
      });
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      logCloudinaryAction('DELETE', 'SUCCESS', { public_id: publicId });
      return true;
    } else {
      logCloudinaryAction('DELETE', 'FAILURE', { public_id: publicId, response: result });
      return false;
    }
  } catch (err) {
    logCloudinaryAction('DELETE', 'FAILURE', { public_id: publicId, error: err.message });
    return false;
  }
}

module.exports = {
  deleteCloudinaryImage,
  getPublicIdFromUrl,
  isImageReferenced
};
