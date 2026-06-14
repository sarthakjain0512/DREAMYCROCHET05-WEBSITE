// seedAdmin.js
// ─────────────────────────────────────────────────────────────────────────────
// One-time Admin Account Seeder for DreamyCrochet05
//
// Run this ONCE to create the admin account in your MongoDB Atlas database:
//   node seedAdmin.js
//
// This reads ADMIN_EMAIL and ADMIN_PASSWORD from your .env file.
// The password is automatically hashed by the Admin model's pre-save hook.
// After running, you can log in at: /dreamycrochet05-admin
//
// ⚠️  IMPORTANT: Keep your .env file private. Never share or commit it.
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ─── Validation ──────────────────────────────────────────────────────────────
if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing from your .env file!');
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ADMIN_EMAIL or ADMIN_PASSWORD is missing from your .env file!');
  console.error('   Please add them and try again.');
  process.exit(1);
}

// ─── Seed Function ───────────────────────────────────────────────────────────
const seedAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas.');

    // Check if an admin account already exists
    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existingAdmin) {
      console.log('ℹ️  Admin account already exists in the database.');
      console.log('   Email:', existingAdmin.email);
      console.log('   Created:', existingAdmin.createdAt.toLocaleString());
      console.log('\n   If you want to reset the password, delete the admin document');
      console.log('   from MongoDB Atlas and run this script again.');
    } else {
      console.log('🌱 Creating admin account...');

      // Create admin — the pre-save hook in Admin.js will auto-hash the password
      const admin = new Admin({
        email: ADMIN_EMAIL.toLowerCase().trim(),
        password: ADMIN_PASSWORD // Will be hashed automatically before saving
      });

      await admin.save();

      console.log('\n🎉 Admin account created successfully!');
      console.log('─────────────────────────────────────────');
      console.log('   Email    : [stored privately in MongoDB]');
      console.log('   Password : [hashed with bcrypt, stored in MongoDB]');
      console.log('   Admin ID :', admin._id);
      console.log('   Created  :', admin.createdAt.toLocaleString());
      console.log('─────────────────────────────────────────');
      console.log('\n✨ You can now log in at: /dreamycrochet05-admin');
    }

  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    // Always close the connection after seeding
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed. Seed complete.');
    process.exit(0);
  }
};

// Run the seeder
seedAdmin();
