const express = require('express');
const router = express.Router();

const { searchCases, getCaseById } = require('../controllers/searchController');

// ─── Search Routes ─────────────────────────────────────────────────────────────

// GET  /api/search?q=<term>&page=1&limit=10  → search cases
router.get('/', searchCases);

// GET  /api/search/:id                        → get single case by MongoDB _id
router.get('/:id', getCaseById);

module.exports = router;
