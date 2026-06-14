const cloudinary = require('cloudinary').v2;

let isConfigured = false;

const isPlaceholder = (val) => {
  return !val || val.trim() === '' || val.toLowerCase().includes('your_') || val.toLowerCase() === 'placeholder';
};

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (
  cloudName && !isPlaceholder(cloudName) &&
  apiKey && !isPlaceholder(apiKey) &&
  apiSecret && !isPlaceholder(apiSecret)
) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
  isConfigured = true;
  console.log('☁️ Cloudinary configured successfully (Secure HTTPS mode enabled).');
} else {
  console.log('⚠️ Cloudinary credentials missing or placeholders in env.');
}

module.exports = {
  cloudinary,
  isConfigured
};
