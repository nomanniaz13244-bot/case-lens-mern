const express = require('express');
const router = express.Router();

const { searchCaseLaws, getSimilarCases } = require('../controllers/caseLawController');

// ─── Case Laws (Pakistani Precedents) Routes ───────────────────────────────────

// GET  /api/case-laws/search  → search judgments (query / court / year / citation)
router.get('/search', searchCaseLaws);

// GET  /api/case-laws/similar/:id → related precedents for one case
router.get('/similar/:id', getSimilarCases);

module.exports = router;
