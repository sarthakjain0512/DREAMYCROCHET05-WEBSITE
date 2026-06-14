const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 *
 * Attempts the primary URI (`process.env.MONGO_URI`). If the connection fails, it falls back to a local MongoDB instance.
 * This ensures the server starts even when the Atlas connection is unreachable.
 */
const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/dreamycrochet';

  // Try primary first (if defined)
  if (primaryUri) {
    try {
      await mongoose.connect(primaryUri);
      console.log(`✅ MongoDB Connected Successfully – ${primaryUri}`);
      return true;
    } catch (err) {
      console.warn('⚠️ Primary MongoDB connection failed, attempting fallback...');
      console.error('   Error:', err.message);
    }
  }

  // Attempt fallback
  try {
    await mongoose.connect(fallbackUri);
    console.log(`✅ MongoDB Connected via fallback – ${fallbackUri}`);
    return true;
  } catch (err) {
    console.error('❌ MongoDB Connection Error (both primary and fallback):', err.message);
    console.error('   Attempted URIs:', primaryUri || 'none', 'and', fallbackUri);
    console.error('   Ensure at least one URI is reachable.');
    return false;
  }
};

module.exports = connectDB;
