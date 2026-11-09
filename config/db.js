const mongoose = require('mongoose');

// ─── MongoDB Atlas (real MVP database — no more in-memory server) ─────────────
// Connects to MONGO_URI from backend .env with a 10-second server-selection
// timeout so slow internet / no WiFi fails fast with a clear message.
let memoryServer = null;

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error(
      '\x1b[31m❌ MONGO_URI is missing from .env. Add: MONGO_URI=mongodb+srv://<user>:<pass>@cluster... \x1b[0m'
    );
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10-second timeout — fail fast, don't hang
    });
    console.log('\x1b[32m✅ MongoDB Atlas Connected successfully!\x1b[0m');
  } catch (error) {
    console.error(
      '\x1b[31m❌ Atlas Connection Failed. Please check your internet or Mobile Hotspot.\x1b[0m'
    );
    console.error(`   Details: ${error.message}`);
    process.exit(1);
  }
};

// Graceful stop when the app shuts down.
const stopDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed.');
  } catch (_) {
    /* ignore */
  }
};

module.exports = connectDB;
module.exports.stopDB = stopDB;
