const express = require('express');
const router = express.Router();
const { chatWithAI, caseSpecificChat, simpleCaseChat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/chat', chatWithAI);
router.post('/case-chat', protect, caseSpecificChat);
router.post('/simple-case-chat', protect, simpleCaseChat);

module.exports = router;
