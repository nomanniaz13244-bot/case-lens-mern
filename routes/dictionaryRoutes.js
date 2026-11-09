const express = require('express');
const router = express.Router();

const { searchTerms, getTermByName } = require('../controllers/dictionaryController');

// ─── Legal Dictionary Routes (public reference content) ──────────────────────

// GET /api/dictionary/search?query=bail&category=Criminal
router.get('/search', searchTerms);

// GET /api/dictionary/term/:term
router.get('/term/:term', getTermByName);

module.exports = router;
