require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const fs = require('fs');

// Dynamically generate/update client-side API configuration file based on environment variables
const configDir = path.join(__dirname, 'config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir);
}
const apiConfigPath = path.join(configDir, 'apiConfig.js');
const apiBaseUrl = process.env.API_BASE_URL || '';
fs.writeFileSync(apiConfigPath, `// DreamyCrochet05 - Dynamically generated API Configuration
const API_BASE_URL = "${apiBaseUrl}";

if (!API_BASE_URL) {
  console.warn("⚠️ [apiConfig] API_BASE_URL is not configured! API requests might fail.");
}
`, 'utf-8');
console.log(`⚙️ Generated config/apiConfig.js with API_BASE_URL: "${apiBaseUrl}"`);


// Models & Defaults for Seeding
const Product = require('./models/Product');
const Setting = require('./models/Setting');
const { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } = require('./utils/localDbHelper');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS and body parser middleware with high limit for base64 uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve local upload fallback files (products go in /uploads/products/)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static assets from current directory
app.use(express.static(__dirname));

// Mount Routers
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));           // Legacy (keep intact)
app.use('/api/custom-orders', require('./routes/customOrderRoutes')); // New inquiry system
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/status', require('./routes/statusRoutes'));


// Secret Route - Serves index.html for Admin Page
app.get('/dreamycrochet05-admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all route to serve the Single Page Application (index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Connect database and seed defaults on success
const startServer = async () => {
  const isMongoConnected = await connectDB();
  if (isMongoConnected) {
    try {
      // Seed default products
      const count = await Product.countDocuments();
      if (count === 0) {
        await Product.insertMany(DEFAULT_PRODUCTS.map(p => {
          let secondaryImages = [];
          if (p.name.includes("Tulip")) secondaryImages = ['photoes/crochet_tulip.png', 'photoes/crochet_rose.png'];
          else if (p.name.includes("Sunflower")) secondaryImages = ['photoes/crochet_sunflower.png', 'photoes/crochet_rose.png'];
          else if (p.name.includes("Plushies")) secondaryImages = ['photoes/crochet_sunflower.png', 'photoes/crochet_rose.png'];
          else if (p.name.includes("Rose")) secondaryImages = ['photoes/crochet_rose.png', 'photoes/crochet_sunflower.png'];
          else secondaryImages = ['photoes/crochet_sunflower.png', 'photoes/crochet_rose.png'];

          const imagesArray = [p.img, ...secondaryImages];

          return {
            title: p.name,
            description: p.desc,
            category: p.badge,
            price: p.price,
            images: imagesArray,
            coverImage: p.img,
            image: p.img,
            featured: p.featured,
            label: p.label || ''
          };
        }));
        console.log('🌱 Seeded default products in MongoDB Atlas with image collections.');
      }

      // Seed default settings
      const settingsCount = await Setting.countDocuments();
      if (settingsCount === 0) {
        await Setting.create(DEFAULT_SETTINGS);
        console.log('🌱 Seeded default homepage settings in MongoDB Atlas.');
      }
    } catch (e) {
      console.error('❌ Seeding error:', e.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 DreamyCrochet05 Production Backend running at http://localhost:${PORT}`);
  });
};

startServer();
