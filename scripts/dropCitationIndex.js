// One-time maintenance: drop the unique index on `citation` so duplicate/empty
// citations can no longer break case creation. Safe to re-run.
require('dotenv').config();
const mongoose = require('mongoose');
const LEGAL_CASES = 'legalcases';

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB Atlas');
    const collection = mongoose.connection.collection(LEGAL_CASES);

    const before = await collection.indexes();
    console.log('Indexes before:', before.map((i) => i.name).join(', '));

    try {
      await collection.dropIndex('citation_1');
      console.log('✅ Dropped index: citation_1');
    } catch (err) {
      if (err.code === 27 || /index not found/i.test(err.message)) {
        console.log('ℹ️ citation_1 index already gone — nothing to drop');
      } else {
        throw err;
      }
    }

    const after = await collection.indexes();
    console.log('Indexes after:', after.map((i) => i.name).join(', '));
    process.exit(0);
  } catch (error) {
    console.error('❌ Index maintenance failed:', error.message);
    process.exit(1);
  }
})();
