const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  console.log('🔧 Attempting to connect to MongoDB...');

  const connectOptions = {
    serverSelectionTimeoutMS: 5000
  };

  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = 'mongodb://127.0.0.1:27017/dreamycrochet';

  // Primary (MongoDB Atlas)
  if (primaryUri) {
    try {
      await mongoose.connect(primaryUri, connectOptions);
      console.log('✅ MongoDB Connected Successfully');
      return true;
    } catch (err) {
      console.warn('⚠️ Primary MongoDB connection failed, trying local MongoDB...');
      console.error(err.message);
    }
  }

  // Local fallback
  try {
    await mongoose.connect(fallbackUri, connectOptions);
    console.log('✅ Local MongoDB Connected');
    return true;
  } catch (err) {
    console.error('❌ MongoDB Connection Failed');
    console.error(err.message);
    return false;
  }
};

module.exports = connectDB;