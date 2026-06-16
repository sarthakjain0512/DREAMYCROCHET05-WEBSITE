require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const fs = require('fs');

// ===============================
// Generate client-side API config
// ===============================
const configDir = path.join(__dirname, 'config');

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir);
}

const apiConfigPath = path.join(configDir, 'apiConfig.js');

const apiBaseUrl =
  process.env.API_BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  (process.env.NODE_ENV === 'production' ? '' : `http://localhost:${process.env.PORT || 8000}`);




fs.writeFileSync(
  apiConfigPath,
  `// DreamyCrochet05 - Auto Generated API Configuration

// API_BASE_URL is derived from env at server start.
// Client-side requests use API_BASE_URL (or fall back to relative host when unset).

const API_BASE_URL = "${apiBaseUrl}";
`,
  'utf8'
);





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
  console.log('Mongo Connected');





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

      }

      // Seed default settings
      const settingsCount = await Setting.countDocuments();
      if (settingsCount === 0) {
        await Setting.create(DEFAULT_SETTINGS);

      }
    } catch (e) {
      console.error('❌ Seeding error:', e.message);
    }
  }


app.listen(PORT, () => {
  console.log('Server Started');
});
};



startServer();
