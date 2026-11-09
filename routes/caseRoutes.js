const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { deleteUserCase } = require('../controllers/adminCaseController');

// ─── Case Routes ───────────────────────────────────────────────────────────────

// DELETE /api/cases/:id → delete a case owned by the logged-in user
router.delete('/:id', protect, deleteUserCase);

module.exports = router;
