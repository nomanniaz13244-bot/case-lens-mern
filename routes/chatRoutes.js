const express = require('express');
const router = express.Router();

const {
  createSession,
  getHistory,
  getSession,
  deleteSession,
  toggleSessionPin,
} = require('../controllers/chatSessionController');
const { protect } = require('../middleware/authMiddleware');

// Every chat-history route is JWT protected — sessions belong to a user.
// IMPORTANT: '/history' is registered before '/:id' so the param route can
// never shadow it.
router.post('/new', protect, createSession);
router.get('/history', protect, getHistory);
router.get('/:id', protect, getSession);
router.patch('/:id/pin', protect, toggleSessionPin);
router.delete('/:id', protect, deleteSession);

module.exports = router;
