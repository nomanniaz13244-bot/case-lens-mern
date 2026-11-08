const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const searchRoutes = require('./routes/searchRoutes');
const { seedCases } = require('./controllers/searchController');
const adminCaseRoutes = require('./routes/adminCaseRoutes');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const draftingRoutes = require('./routes/draftingRoutes');

// Load environment variables from .env file
dotenv.config();

console.log(`🤖 AI Provider set to: ${String(process.env.AI_PROVIDER || 'gemini').trim().toLowerCase()}`);

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health-check / root route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Case Lens AI API Running' });
});

// Authentication Module
app.use('/api/auth', authRoutes);

// Legal Search Module
app.use('/api/search', searchRoutes);

// Dev-only: seed sample legal cases → GET /api/seed
app.get('/api/seed', seedCases);

// Admin Case Management Routes
app.use('/api/admin/cases', adminCaseRoutes);

// AI Legal Chat Module
app.use('/api/ai', aiRoutes);
app.use('/api/workspace', workspaceRoutes);
// Legal Drafting Module
app.use('/api/drafting', draftingRoutes);
// Compatibility mount: admin create-ai also resolves under /api/workspace/create-ai.
app.use('/api/workspace', adminCaseRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown: stop the in-memory MongoDB when the app is terminated.
const stopDB = require('./config/db').stopDB;
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await stopDB();
  server.close(() => process.exit(0));
});
process.on('SIGTERM', async () => {
  await stopDB();
  server.close(() => process.exit(0));
});
process.on('unhandledRejection', async (reason) => {
  console.error('⚠️ Unhandled promise rejection (server kept alive):', reason);
});

