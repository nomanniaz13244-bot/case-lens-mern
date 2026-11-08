const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// ─── In-Memory MongoDB (no internet, no Atlas, no local install) ───────────────
// Starts a throwaway MongoDB instance inside the Node process, connects to it,
// and logs the ephemeral URI. The database is wiped on every server restart.
let memoryServer = null;

const connectDB = async () => {
  try {
    console.log('🔄 Starting In-Memory MongoDB...');

    // Optional: reuse a data directory via MMS_DATA_DIR so data survives restarts.
    memoryServer = await MongoMemoryServer.create({
      instance: {
        // dbName keeps data namespaced even across ephemeral instances.
        dbName: 'case_lens_ai',
        port: process.env.MMS_PORT ? Number(process.env.MMS_PORT) : undefined,
        ip: process.env.MMS_IP || '127.0.0.1',
      },
    });

    const uri = memoryServer.getUri();
    await mongoose.connect(uri);

    console.log('✅ In-Memory MongoDB Connected');
    console.log(`✅ Connection URI: ${uri} (ephemeral — wiped on restart)`);

    // Optional auto-seed so the demo has data on first boot: set SEED_ON_START=1
    // and have a seed routine registered (server.js exposes GET /api/seed).
    if (process.env.SEED_ON_START === '1') {
      try {
        const { seedCases } = require('../controllers/searchController');
        await seedCases({ silent: true }, { status: () => ({ json: () => {} }) });
        console.log('🌱 Auto-seed completed.');
      } catch (seedError) {
        console.warn(`⚠️ Auto-seed skipped: ${seedError.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ In-Memory MongoDB Error: ${error.message}`);
    // Common cause: the mongod binary is still downloading on first run —
    // it is cached in ./node_modules/.cache/mongodb-memory-server afterwards.
    // Retry by simply running the backend again.
    process.exit(1);
  }
};

// Graceful stop when the app shuts down.
const stopDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (_) {
    /* ignore */
  }
  try {
    if (memoryServer) await memoryServer.stop();
    console.log('🛑 In-Memory MongoDB stopped.');
  } catch (_) {
    /* ignore */
  }
};

module.exports = connectDB;
module.exports.stopDB = stopDB;
