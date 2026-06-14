// services/cloudinaryService.js
// ─────────────────────────────────────────────────────────────────────────────
// DreamyCrochet05 — Cloudinary Upload Service
// ─────────────────────────────────────────────────────────────────────────────

const { cloudinary, isConfigured } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

/**
 * Structured log helper
 */
const logCloudinaryAction = (action, status, details) => {
  const timestamp = new Date().toISOString();
  console.log(`[Cloudinary Log] [${timestamp}] [${action}] [${status}]`, JSON.stringify(details));
};

/**
 * Helper to get local directory and URL path based on folder name
 */
function getLocalPathInfo(folder) {
  let sub = 'products';
  if (folder.toLowerCase().includes('custom-orders')) {
    sub = 'custom-orders';
  } else if (folder.toLowerCase().includes('homepage')) {
    sub = 'homepage';
  } else if (folder.toLowerCase().includes('products')) {
    sub = 'products';
  } else {
    sub = folder.split('/').pop() || 'others';
  }

  const uploadDir = path.join(__dirname, '..', 'uploads', sub);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return {
    uploadDir,
    urlPrefix: `/uploads/${sub}`
  };
}

/**
 * Save base64 string or file path locally as a fallback
 */
async function saveFileLocally(fileSource, folder) {
  const { uploadDir, urlPrefix } = getLocalPathInfo(folder);
  let buffer;
  let ext = '.jpg';

  if (typeof fileSource === 'string' && fileSource.startsWith('data:image')) {
    const matches = fileSource.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }
    const mime = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
    if (mime.includes('png')) ext = '.png';
    else if (mime.includes('webp')) ext = '.webp';
    else if (mime.includes('gif')) ext = '.gif';
  } else if (typeof fileSource === 'string') {
    buffer = fs.readFileSync(fileSource);
    ext = path.extname(fileSource) || '.jpg';
  } else {
    throw new Error('Unsupported file source for local fallback');
  }

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const absPath = path.join(uploadDir, filename);
  fs.writeFileSync(absPath, buffer);

  const localUrl = `${urlPrefix}/${filename}`;
  return {
    url: localUrl,
    public_id: localUrl
  };
}

/**
 * Save file buffer locally as a fallback
 */
async function saveBufferLocally(buffer, mimetype, folder) {
  const { uploadDir, urlPrefix } = getLocalPathInfo(folder);
  let ext = '.jpg';
  if (mimetype.includes('png')) ext = '.png';
  else if (mimetype.includes('webp')) ext = '.webp';
  else if (mimetype.includes('gif')) ext = '.gif';

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const absPath = path.join(uploadDir, filename);
  fs.writeFileSync(absPath, buffer);

  const localUrl = `${urlPrefix}/${filename}`;
  return {
    url: localUrl,
    public_id: localUrl
  };
}

/**
 * Retries any upload operation up to 3 times
 */
async function uploadWithRetry(uploadFn, ...args) {
  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      attempts++;
      return await uploadFn(...args);
    } catch (err) {
      logCloudinaryAction('UPLOAD_RETRY', 'ATTEMPT_FAILED', {
        attempt: attempts,
        error: err.message
      });
      if (attempts >= maxAttempts) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

/**
 * Uploads a base64 string or file path to Cloudinary
 * Options applied: auto format, auto quality, secure (HTTPS)
 */
async function uploadImageToCloudinary(fileSource, folder = 'DreamyCrochet05/products') {
  if (!isConfigured) {
    return saveFileLocally(fileSource, folder);
  }

  const options = {
    folder: folder,
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
    resource_type: 'image'
  };

  const uploadTask = async () => {
    const startTime = Date.now();
    const result = await cloudinary.uploader.upload(fileSource, options);
    const responseTime = Date.now() - startTime;

    logCloudinaryAction('UPLOAD', 'SUCCESS', {
      public_id: result.public_id,
      url: result.secure_url,
      responseTimeMs: responseTime,
      folder: folder
    });

    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  };

  try {
    return await uploadWithRetry(uploadTask);
  } catch (err) {
    logCloudinaryAction('UPLOAD', 'FAILURE', { error: err.message, folder: folder });
    throw new Error(`Cloudinary upload failed: ${err.message}`);
  }
}

/**
 * Uploads a buffer directly using Cloudinary's upload stream
 */
async function uploadBufferToCloudinary(buffer, mimetype, folder = 'DreamyCrochet05/custom-orders') {
  if (!isConfigured) {
    return saveBufferLocally(buffer, mimetype, folder);
  }

  const options = {
    folder: folder,
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
    resource_type: 'image'
  };

  const uploadTask = () => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          return reject(error);
        }
        const responseTime = Date.now() - startTime;
        logCloudinaryAction('UPLOAD_BUFFER', 'SUCCESS', {
          public_id: result.public_id,
          url: result.secure_url,
          responseTimeMs: responseTime,
          folder: folder
        });
        resolve({
          url: result.secure_url,
          public_id: result.public_id
        });
      });
      stream.end(buffer);
    });
  };

  try {
    return await uploadWithRetry(uploadTask);
  } catch (err) {
    logCloudinaryAction('UPLOAD_BUFFER', 'FAILURE', { error: err.message, folder: folder });
    throw new Error(`Cloudinary buffer upload failed: ${err.message}`);
  }
}

module.exports = {
  uploadImageToCloudinary,
  uploadBufferToCloudinary,
  logCloudinaryAction
};
