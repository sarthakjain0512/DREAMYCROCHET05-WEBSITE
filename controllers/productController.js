// controllers/productController.js
// ─────────────────────────────────────────────────────────────────────────────
// Product Management Controller for DreamyCrochet05
// Supports direct MongoDB Atlas operations and falls back to local JSON DB if offline.
// ─────────────────────────────────────────────────────────────────────────────

const Product = require('../models/Product');
const { uploadImage } = require('../utils/imageHelper');
const { getLocalDB, saveLocalDB, isMongoDBConnected } = require('../utils/localDbHelper');
const { deleteCloudinaryImage } = require('../utils/deleteCloudinaryImage');
const { uploadBufferToCloudinary } = require('../services/cloudinaryService');

// ─── Helper: Map DB/JSON Object → Frontend JSON ──────────────────────────────
const getUrl = (val) => {
  if (val && typeof val === 'object' && val.url) return val.url;
  return val || '';
};

const mapProduct = (p) => {
  const idVal = p._id || p.id || 'prod-' + Math.random().toString(36).substr(2, 9);
  const titleVal = p.title || p.name || '';
  const descVal = p.description || p.desc || '';
  const catVal = p.category || p.badge || 'Others';
  const imgVal = getUrl(p.image || p.img);
  const coverImageVal = getUrl(p.coverImage) || imgVal;

  let imagesVal = [];
  if (p.images && Array.isArray(p.images)) {
    imagesVal = p.images.map(img => getUrl(img));
  } else {
    imagesVal = imgVal ? [imgVal] : [];
  }

  return {
    _id: idVal,
    id: idVal,
    name: titleVal,
    title: titleVal,
    desc: descVal,
    description: descVal,
    badge: catVal,
    category: catVal,
    price: p.price || 'Ask Us',
    img: imgVal,
    image: imgVal,
    images: imagesVal,
    coverImage: coverImageVal,
    label: p.label || '',
    featured: !!p.featured,
    isVisible: p.isVisible !== undefined ? p.isVisible : true,
    instagramLink: p.instagramLink || '',
    viewCount: p.viewCount || 0,
    createdAt: p.createdAt || new Date(),
    updatedAt: p.updatedAt || new Date()
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products
// ─────────────────────────────────────────────────────────────────────────────
const getProducts = async (req, res) => {
  try {
    const isAdminRequest = !!req.adminRequested;

    if (isMongoDBConnected()) {
      const query = isAdminRequest ? {} : { isVisible: true };
      const products = await Product.find(query).sort({ featured: -1, createdAt: -1 });
      return res.status(200).json(products.map(mapProduct));
    } else {
      const db = getLocalDB();
      let list = db.products.map(mapProduct);
      if (!isAdminRequest) {
        list = list.filter(p => p.isVisible);
      }
      list.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      return res.status(200).json(list);
    }
  } catch (err) {
    console.error('❌ getProducts error:', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/stats
// ─────────────────────────────────────────────────────────────────────────────
const getProductStats = async (req, res) => {
  try {
    if (isMongoDBConnected()) {
      const [total, featured, visible, hidden, topViewed] = await Promise.all([
        Product.countDocuments({}),
        Product.countDocuments({ featured: true }),
        Product.countDocuments({ isVisible: { $ne: false } }),
        Product.countDocuments({ isVisible: false }),
        Product.find({}).sort({ viewCount: -1 }).limit(5).select('title image viewCount category')
      ]);

      const totalViews = await Product.aggregate([
        { $group: { _id: null, total: { $sum: '$viewCount' } } }
      ]);

      return res.status(200).json({
        total,
        featured,
        visible,
        hidden,
        totalViews: totalViews[0]?.total || 0,
        topViewed: topViewed.map(p => ({
          id: p._id,
          name: p.title,
          image: getUrl(p.image),
          viewCount: p.viewCount,
          category: p.category
        }))
      });
    } else {
      const db = getLocalDB();
      const mapped = db.products.map(mapProduct);
      
      const total = mapped.length;
      const featured = mapped.filter(p => p.featured).length;
      const visible = mapped.filter(p => p.isVisible).length;
      const hidden = total - visible;
      const totalViews = mapped.reduce((sum, p) => sum + (p.viewCount || 0), 0);
      const topViewed = [...mapped]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.title,
          image: p.image,
          viewCount: p.viewCount,
          category: p.category
        }));

      return res.status(200).json({
        total,
        featured,
        visible,
        hidden,
        totalViews,
        topViewed
      });
    }
  } catch (err) {
    console.error('❌ getProductStats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/:id
// ─────────────────────────────────────────────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoDBConnected()) {
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.status(200).json(mapProduct(product));
    } else {
      const db = getLocalDB();
      const p = db.products.find(prod => (prod.id || prod._id) === id);
      if (!p) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.status(200).json(mapProduct(p));
    }
  } catch (err) {
    console.error('❌ getProductById error:', err);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products/:id/view
// ─────────────────────────────────────────────────────────────────────────────
const incrementViewCount = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoDBConnected()) {
      await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    } else {
      const db = getLocalDB();
      const p = db.products.find(prod => (prod.id || prod._id) === id);
      if (p) {
        p.viewCount = (p.viewCount || 0) + 1;
        saveLocalDB();
      }
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ incrementViewCount error:', err);
    return res.status(200).json({ success: false });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/products
// Admin only: Creates a new product (handles both base64 and multipart file buffers)
// ─────────────────────────────────────────────────────────────────────────────
const addProduct = async (req, res) => {
  const newlyUploadedImages = [];
  try {
    const { title, description, category, price, label, featured, isVisible, instagramLink, imageBase64, imagesBase64, coverImageIndex } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Product title is required' });
    }
    if (!price || !price.trim()) {
      return res.status(400).json({ error: 'Product price is required' });
    }

    // Duplicate check
    if (isMongoDBConnected()) {
      const existing = await Product.findOne({
        title: { $regex: new RegExp(`^${title.trim()}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({ error: `A product named "${title.trim()}" already exists` });
      }
    } else {
      const db = getLocalDB();
      const existing = db.products.find(p => (p.title || p.name || '').toLowerCase().trim() === title.toLowerCase().trim());
      if (existing) {
        return res.status(400).json({ error: `A product named "${title.trim()}" already exists` });
      }
    }

    // Image uploads collection
    let imageUrls = [];
    if (imagesBase64 && Array.isArray(imagesBase64)) {
      if (imagesBase64.length > 20) {
        return res.status(400).json({ error: 'Maximum 20 images are allowed.' });
      }
      for (const item of imagesBase64) {
        const urlObj = await uploadImage(item, 'products');
        if (urlObj) {
          imageUrls.push(urlObj);
          if (item.startsWith('data:image')) {
            newlyUploadedImages.push(urlObj);
          }
        }
      }
    } else if (req.file) {
      // Memory storage buffer upload
      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size must be under 10MB.' });
      }
      const urlObj = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, 'DreamyCrochet05/products');
      if (urlObj) {
        imageUrls.push(urlObj);
        newlyUploadedImages.push(urlObj);
      }
    } else if (imageBase64 && imageBase64.startsWith('data:image')) {
      const urlObj = await uploadImage(imageBase64, 'products');
      if (urlObj) {
        imageUrls.push(urlObj);
        newlyUploadedImages.push(urlObj);
      }
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({ error: 'At least one product image is required' });
    }

    let coverImg = imageUrls[0];
    const idx = parseInt(coverImageIndex, 10);
    if (!isNaN(idx) && idx >= 0 && idx < imageUrls.length) {
      coverImg = imageUrls[idx];
    }

    let savedProduct;
    try {
      if (isMongoDBConnected()) {
        const product = new Product({
          title: title.trim(),
          description: description?.trim() || '',
          category: category || 'Others',
          price: price.trim(),
          images: imageUrls,
          coverImage: coverImg,
          label: label?.trim() || '',
          featured: featured === 'true' || featured === true,
          isVisible: isVisible === 'false' || isVisible === false ? false : true,
          instagramLink: instagramLink?.trim() || ''
        });
        await product.save();
        savedProduct = mapProduct(product);
      } else {
        const db = getLocalDB();
        const idVal = 'prod-' + Date.now();
        const localProduct = {
          id: idVal,
          name: title.trim(),
          desc: description?.trim() || '',
          badge: category || 'Others',
          price: price.trim(),
          images: imageUrls,
          img: coverImg,
          label: label?.trim() || '',
          featured: featured === 'true' || featured === true,
          isVisible: isVisible === 'false' || isVisible === false ? false : true,
          instagramLink: instagramLink?.trim() || '',
          viewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        db.products.push(localProduct);
        saveLocalDB();
        savedProduct = mapProduct(localProduct);
      }
    } catch (dbError) {
      // ── Consistency Rollback: If MongoDB/local DB fails, delete newly uploaded assets from Cloudinary ──
      console.error('❌ Database save failed. Rolling back Cloudinary uploads...', dbError);
      for (const img of newlyUploadedImages) {
        await deleteCloudinaryImage(img);
      }
      throw dbError;
    }

    return res.status(201).json({
      success: true,
      product: savedProduct,
      message: `"${title.trim()}" added successfully`
    });

  } catch (err) {
    console.error('❌ addProduct error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add product' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/products/:id
// Admin only: Updates an existing product (handles replace logic safely)
// ─────────────────────────────────────────────────────────────────────────────
const editProduct = async (req, res) => {
  const newlyUploadedImages = [];
  try {
    const { id } = req.params;
    const { title, description, category, price, label, featured, isVisible, instagramLink, imageBase64, imagesBase64, coverImageIndex } = req.body;

    // Duplicate check
    if (title) {
      if (isMongoDBConnected()) {
        const existing = await Product.findOne({
          title: { $regex: new RegExp(`^${title.trim()}$`, 'i') },
          _id: { $ne: id }
        });
        if (existing) {
          return res.status(400).json({ error: `A product named "${title.trim()}" already exists` });
        }
      } else {
        const db = getLocalDB();
        const existing = db.products.find(p => 
          (p.id || p._id) !== id && 
          (p.title || p.name || '').toLowerCase().trim() === title.toLowerCase().trim()
        );
        if (existing) {
          return res.status(400).json({ error: `A product named "${title.trim()}" already exists` });
        }
      }
    }

    // Retrieve original product data first for comparison
    let oldProductObj = null;
    if (isMongoDBConnected()) {
      oldProductObj = await Product.findById(id);
    } else {
      const db = getLocalDB();
      oldProductObj = db.products.find(p => (p.id || p._id) === id);
    }

    if (!oldProductObj) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Image processing
    let imageUrls = oldProductObj.images || [];
    let coverImg = oldProductObj.coverImage || oldProductObj.image;

    if (imagesBase64 && Array.isArray(imagesBase64)) {
      if (imagesBase64.length > 20) {
        return res.status(400).json({ error: 'Maximum 20 images are allowed.' });
      }
      imageUrls = [];
      for (const item of imagesBase64) {
        const urlObj = await uploadImage(item, 'products');
        if (urlObj) {
          imageUrls.push(urlObj);
          // Track brand new base64 uploads
          if (typeof item === 'string' && item.startsWith('data:image')) {
            newlyUploadedImages.push(urlObj);
          }
        }
      }
      
      let coverIdx = parseInt(coverImageIndex, 10);
      if (isNaN(coverIdx) || coverIdx < 0 || coverIdx >= imageUrls.length) {
        coverIdx = 0;
      }
      coverImg = imageUrls[coverIdx];
    } else if (req.file) {
      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size must be under 10MB.' });
      }
      const urlObj = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, 'DreamyCrochet05/products');
      if (urlObj) {
        imageUrls = [urlObj];
        coverImg = urlObj;
        newlyUploadedImages.push(urlObj);
      }
    } else if (imageBase64 && imageBase64.startsWith('data:image')) {
      const urlObj = await uploadImage(imageBase64, 'products');
      if (urlObj) {
        imageUrls = [urlObj];
        coverImg = urlObj;
        newlyUploadedImages.push(urlObj);
      }
    }

    let savedProduct;
    try {
      if (isMongoDBConnected()) {
        const product = await Product.findById(id);
        if (title) product.title = title.trim();
        if (description !== undefined) product.description = description.trim();
        if (category) product.category = category;
        if (price) product.price = price.trim();
        if (label !== undefined) product.label = label.trim();
        if (featured !== undefined) product.featured = featured === 'true' || featured === true;
        if (isVisible !== undefined) product.isVisible = !(isVisible === 'false' || isVisible === false);
        if (instagramLink !== undefined) product.instagramLink = instagramLink.trim();
        
        product.images = imageUrls;
        product.coverImage = coverImg;

        await product.save();
        savedProduct = mapProduct(product);
      } else {
        const db = getLocalDB();
        const idx = db.products.findIndex(p => (p.id || p._id) === id);
        const product = db.products[idx];

        if (title) product.name = title.trim();
        if (description !== undefined) product.desc = description.trim();
        if (category) product.badge = category;
        if (price) product.price = price.trim();
        if (label !== undefined) product.label = label.trim();
        if (featured !== undefined) product.featured = featured === 'true' || featured === true;
        if (isVisible !== undefined) product.isVisible = !(isVisible === 'false' || isVisible === false);
        if (instagramLink !== undefined) product.instagramLink = instagramLink.trim();
        
        product.images = imageUrls;
        product.img = coverImg;
        product.updatedAt = new Date();

        db.products[idx] = product;
        saveLocalDB();
        savedProduct = mapProduct(product);
      }
    } catch (dbError) {
      // ── Consistency Rollback: If MongoDB/local DB fails, delete newly uploaded assets from Cloudinary ──
      console.error('❌ Database update failed. Rolling back Cloudinary uploads...', dbError);
      for (const img of newlyUploadedImages) {
        await deleteCloudinaryImage(img);
      }
      throw dbError;
    }

    // ── Safe Delete Logic: Delete old images that are no longer in the product gallery ──
    const oldImages = oldProductObj.images || [];
    const getPId = (v) => (v && typeof v === 'object' ? v.public_id : null);
    
    const newPublicIds = imageUrls.map(img => getPId(img)).filter(Boolean);
    const deletedImages = oldImages.filter(img => {
      const oldPid = getPId(img);
      return oldPid && !newPublicIds.includes(oldPid);
    });

    for (const urlObj of deletedImages) {
      await deleteCloudinaryImage(urlObj);
    }

    return res.status(200).json({
      success: true,
      product: savedProduct,
      message: `"${savedProduct.title}" updated successfully`
    });

  } catch (err) {
    console.error('❌ editProduct error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update product' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/products/:id
// Admin only: Permanently deletes a product and all associated Cloudinary images
// ─────────────────────────────────────────────────────────────────────────────
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let title = '';
    let imagesToDelete = [];

    if (isMongoDBConnected()) {
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      title = product.title;
      imagesToDelete = product.images || [];
      await Product.findByIdAndDelete(id);
    } else {
      const db = getLocalDB();
      const idx = db.products.findIndex(prod => (prod.id || prod._id) === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }
      title = db.products[idx].name || db.products[idx].title;
      imagesToDelete = db.products[idx].images || [];
      db.products.splice(idx, 1);
      saveLocalDB();
    }

    // Delete associated images from Cloudinary safely
    for (const imgUrlObj of imagesToDelete) {
      await deleteCloudinaryImage(imgUrlObj);
    }

    return res.status(200).json({
      success: true,
      message: `"${title}" has been permanently deleted`
    });
  } catch (err) {
    console.error('❌ deleteProduct error:', err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/products/:id/visibility
// ─────────────────────────────────────────────────────────────────────────────
const toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    let title = '';
    let isVisible = true;
    if (isMongoDBConnected()) {
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      product.isVisible = !product.isVisible;
      await product.save();
      title = product.title;
      isVisible = product.isVisible;
    } else {
      const db = getLocalDB();
      const idx = db.products.findIndex(prod => (prod.id || prod._id) === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }
      db.products[idx].isVisible = !(db.products[idx].isVisible !== false);
      saveLocalDB();
      title = db.products[idx].name || db.products[idx].title;
      isVisible = db.products[idx].isVisible;
    }

    return res.status(200).json({
      success: true,
      isVisible,
      message: isVisible
        ? `"${title}" is now visible to visitors`
        : `"${title}" is now hidden from visitors`
    });
  } catch (err) {
    console.error('❌ toggleVisibility error:', err);
    return res.status(500).json({ error: 'Failed to toggle visibility' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/products/:id/featured
// ─────────────────────────────────────────────────────────────────────────────
const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    let title = '';
    let featured = false;
    if (isMongoDBConnected()) {
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      product.featured = !product.featured;
      await product.save();
      title = product.title;
      featured = product.featured;
    } else {
      const db = getLocalDB();
      const idx = db.products.findIndex(prod => (prod.id || prod._id) === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }
      db.products[idx].featured = !db.products[idx].featured;
      saveLocalDB();
      title = db.products[idx].name || db.products[idx].title;
      featured = db.products[idx].featured;
    }

    return res.status(200).json({
      success: true,
      featured,
      message: featured
        ? `"${title}" is now featured`
        : `"${title}" removed from featured`
    });
  } catch (err) {
    console.error('❌ toggleFeatured error:', err);
    return res.status(500).json({ error: 'Failed to toggle featured status' });
  }
};

module.exports = {
  getProducts,
  getProductStats,
  getProductById,
  incrementViewCount,
  addProduct,
  editProduct,
  deleteProduct,
  toggleVisibility,
  toggleFeatured
};
