const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const searchRoutes = require('./routes/searchRoutes');
const { seedCases } = require('./controllers/searchController');
const adminCaseRoutes = require('./routes/adminCaseRoutes');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health-check / root route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Case Lens AI API Running' });
});

// Legal Search Module
app.use('/api/search', searchRoutes);

// Dev-only: seed sample legal cases → GET /api/seed
app.get('/api/seed', seedCases);

// Admin Case Management Routes
app.use('/api/admin/cases', adminCaseRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
