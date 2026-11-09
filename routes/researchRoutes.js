const express = require('express');
const router = express.Router();

const { searchResearch } = require('../controllers/researchController');

// ─── Legal Research Routes ─────────────────────────────────────────────────────

// GET  /api/research/search?query=<term>  → statutes + judgments combined
router.get('/search', searchResearch);

module.exports = router;
