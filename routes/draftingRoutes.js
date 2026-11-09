const express = require('express');
const router = express.Router();
const {
  generateDraft,
  editDraft,
  getDrafts,
  getDraftById,
  saveDraft,
  deleteDraft,
  toggleDraftPin,
} = require('../controllers/draftingController');
const { protect } = require('../middleware/authMiddleware');

// Every drafting route is JWT protected.
router.post('/generate', protect, generateDraft);
router.post('/edit', protect, editDraft);
router.get('/', protect, getDrafts);
router.get('/:id', protect, getDraftById);
router.put('/:id', protect, saveDraft);
router.delete('/:id', protect, deleteDraft);
router.patch('/:id/pin', protect, toggleDraftPin);

module.exports = router;
