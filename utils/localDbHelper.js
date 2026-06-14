const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const LOCAL_DB_FILE = path.join(__dirname, '..', 'local_db.json');

const DEFAULT_PRODUCTS = [
  {
    id: "pastel-tulips",
    name: "Pastel Tulips",
    price: "₹350",
    desc: "Stitch by stitch crafted set of 5 pastel pink and lavender tulips. Bundled in premium craft paper. Gives a delicate look on nightstands or study desks.",
    badge: "Bouquet",
    label: "Best Seller",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuASmYaUEqtiY2wH3jiCgJSFQYGyJM8BYwkgd4vITCkMeXBwumXyg8otUSXlDZcHr0ticf5nPN_Uuv5ZQCbXK5YuU5ySXM3V7cwAgH3GL6fHLJgiTzzx_d3y92WHJo6mYNi8QV6jsOuHUqoLabccynhPombFczjW2m0y1ujUtl-rba6TJ3BX1ZQzeCttbwyJq1fL17n6wtPctDJVX2fCHCgLNXfUGllvz1RWswUXxiGX4cWdkOyi4UU15cd7jhuqfeeuHDF_wq3Vtjs",
    featured: true
  },
  {
    id: "sunny-sunflower",
    name: "Sunny Sunflower",
    price: "₹280",
    desc: "Bring warm sunlight indoors with our signature single-stem crochet sunflower. Heavy high-quality cotton yarn keeps it standing bright forever.",
    badge: "Single Stem",
    label: "Cozy Vibe",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCiVZ-eOCmlOjwt7GPfBrywqnFIFVUwYFQWZ9GAIhw-DNiz66dJJNAYvy0i-wnZL5ej2W7DIAQ-nyk5okomL5Otc21LSGDj8QKBh__dbYiWkmyad4YNYb9dSD4ax92a4pue9_HQp7JScwzkybuqoxOadiaI3jxgdqnFEWGDBT19qG64Vks7QaAk_ROe3zrheOwJCupdbPJSpDZF8uXTLWH5WsEtIUE2dB8XfM_a_t4caw7P18bFtyQ2vaRAcUmc38UgUPeiQSB_nro",
    featured: true
  },
  {
    id: "cozy-plushies",
    name: "Cozy Plushies",
    price: "From ₹150",
    desc: "Perfect pocket-sized companion plushies (bunny, mushrooms, mini bears). Filled with soft premium hypoallergenic polyfill, hand-detailed eyes.",
    badge: "Amigurumi",
    label: "Mini Art",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuARR88LBW3NDWz5nd3y8nZwPYAfvrWSOw2BPY4xpERv-Z5xHGx_S_C8NsGyEhUJvZkmYGFKsTm2Rj7Pf9uXMFxQZKpN-tcYRS3xK-Rqnailc-56fhBrP-IPEWfFPfLopND0sKlbC8n7dl24KL3bxTKXd-CEpF4i-8REMoZtcf1gfT2vWfmsDNij_zi2nxMRWJ5xLk5ObsLWYUNLMjLMU7gM-cHJaNxO3MND5fibBeIG2wV-XHW2dM2Th4DZ7md-eqBTYfGG70LBj2U",
    featured: true
  },
  {
    id: "rose-bouquet",
    name: "Rose Bouquet",
    price: "₹400",
    desc: "A timeless symbol of love, handstitched petal by petal. Bundled with care in high-quality wrappers.",
    badge: "Bouquet",
    label: "New 🌹",
    img: "photoes/crochet_rose.png",
    featured: false
  },
  {
    id: "keychain-set",
    name: "Keychain Set",
    price: "₹120",
    desc: "Adorable mini crochet keychains, perfect for gifting and accessorizing your bags.",
    badge: "Accessory",
    label: "Popular 🌸",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuASmYaUEqtiY2wH3jiCgJSFQYGyJM8BYwkgd4vITCkMeXBwumXyg8otUSXlDZcHr0ticf5nPN_Uuv5ZQCbXK5YuU5ySXM3V7cwAgH3GL6fHLJgiTzzx_d3y92WHJo6mYNi8QV6jsOuHUqoLabccynhPombFczjW2m0y1ujUtl-rba6TJ3BX1ZQzeCttbwyJq1fL17n6wtPctDJVX2fCHCgLNXfUGllvz1RWswUXxiGX4cWdkOyi4UU15cd7jhuqfeeuHDF_wq3Vtjs",
    featured: false
  }
];

const DEFAULT_SETTINGS = {
  heroTitle: 'Flowers That Never Fade. Memories That Make Forever.',
  heroSubtitleLine1: 'Har stitch mein thoda sa waqt, thodi si mehnat aur bahut saara pyaar chhupa hai. ❤️',
  heroSubtitleLine2: 'Handmade by Mom • Made to be Remembered 🌷',
  heroImage: 'photoes/hero_cover.png'
};

let localDB = { products: DEFAULT_PRODUCTS, orders: [], settings: DEFAULT_SETTINGS };

const getLocalDB = () => {
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      localDB = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf-8'));
    } catch (e) {
      console.error('❌ Error parsing local_db.json, using defaults.');
    }
  } else {
    saveLocalDB();
  }
  return localDB;
};

const saveLocalDB = () => {
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(localDB, null, 2), 'utf-8');
};

const isMongoDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  getLocalDB,
  saveLocalDB,
  isMongoDBConnected,
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS
};
