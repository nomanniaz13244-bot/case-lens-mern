const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { createWorkspaceCase, getUserCases, getCaseById } = require('../controllers/adminCaseController');
const { caseSpecificChat } = require('../controllers/aiController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});

router.get('/my-cases', protect, getUserCases);
router.get('/case/:caseId', protect, getCaseById);
router.post('/create', protect, upload.single('file'), createWorkspaceCase);
router.post('/create-ai', protect, upload.single('file'), createWorkspaceCase);
router.post('/chat', protect, caseSpecificChat);

module.exports = router;
