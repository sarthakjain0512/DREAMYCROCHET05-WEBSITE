const { uploadImageToCloudinary } = require('../services/cloudinaryService');

async function uploadImage(base64Data, subfolder = 'products') {
  if (!base64Data) return null;

  // If it's already a public_id + url object, return as-is
  if (typeof base64Data === 'object' && base64Data.url && base64Data.public_id) {
    return base64Data;
  }

  // If it's already a string URL (not base64), wrap it
  if (typeof base64Data === 'string' && !base64Data.startsWith('data:image')) {
    return {
      url: base64Data,
      public_id: ''
    };
  }

  // Real upload to Cloudinary
  try {
    // Map folder to correct path
    const folderPath = subfolder.startsWith('DreamyCrochet05') 
      ? subfolder 
      : `DreamyCrochet05/${subfolder}`;
      
    const result = await uploadImageToCloudinary(base64Data, folderPath);
    return result; // { url, public_id }
  } catch (err) {
    console.error('❌ Cloudinary upload helper failed:', err.message);
    throw err; // Bubbles up to controller for proper error handling
  }
}

module.exports = {
  uploadImage
};
