const express = require('express');
const router = express.Router();
const {
  chatWithAI,
  caseSpecificChat,
  simpleCaseChat,
  explainLaw,
  summarizeJudgment,
  extractPrinciples,
  defineTerm,
  getCaseChatHistory,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/chat', protect, chatWithAI);
router.post('/case-chat', protect, caseSpecificChat);
router.get('/case-chat/:caseId', protect, getCaseChatHistory);
router.post('/simple-case-chat', protect, simpleCaseChat);
router.post('/explain-law', protect, explainLaw);
router.post('/summarize-judgment', protect, summarizeJudgment);
router.post('/extract-principles', protect, extractPrinciples);
router.post('/define-term', defineTerm);

module.exports = router;
