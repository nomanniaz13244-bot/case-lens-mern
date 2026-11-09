const mongoose = require('mongoose');
const ChatSession = require('../models/ChatSession');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

const getUserId = (req) => req.user?._id || req.user?.id;

const MAX_MESSAGES_PER_SESSION = 500;

// ─── POST /api/chat/new ──────────────────────────────────────────────────────
// @desc   Create a new, empty chat session for the signed-in user
// @access Private (JWT)
const createSession = async (req, res) => {
  try {
    const title = String(req.body?.title || 'New Chat')
      .trim()
      .slice(0, 120) || 'New Chat';

    const session = await ChatSession.create({
      userId: getUserId(req),
      title,
      messages: [],
    });

    return res.status(201).json({
      success: true,
      message: 'New chat session created.',
      data: {
        _id: session._id,
        title: session.title,
        updatedAt: session.updatedAt,
        messages: [],
      },
    });
  } catch (error) {
    console.error('Create chat session error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: 'Unable to create a new chat session.',
    });
  }
};

// ─── GET /api/chat/history ───────────────────────────────────────────────────
// @desc   List the signed-in user's chat sessions (newest activity first).
//         Only lightweight metadata — never the full message arrays.
// @access Private (JWT)
const getHistory = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: getUserId(req) })
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(100)
      .select('_id title isPinned updatedAt');

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error('List chat history error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: 'Unable to load the chat history.',
    });
  }
};

// ─── GET /api/chat/:id ───────────────────────────────────────────────────────
// @desc   Fetch the full messages array of one of the user's chat sessions
// @access Private (JWT)
const getSession = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found.',
      });
    }

    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: getUserId(req),
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: session._id,
        title: session.title,
        updatedAt: session.updatedAt,
        messages: session.messages.map((message) => ({
          role: message.role,
          text: message.text,
          citedCases: Array.isArray(message.citedCases) ? message.citedCases : [],
          createdAt: message.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get chat session error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: 'Unable to load the chat session.',
    });
  }
};

// ─── DELETE /api/chat/:id ────────────────────────────────────────────────────
// @desc   Delete one of the user's chat sessions
// @access Private (JWT)
const deleteSession = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found.',
      });
    }

    const session = await ChatSession.findOneAndDelete({
      _id: req.params.id,
      userId: getUserId(req),
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Chat deleted.',
      data: { _id: session._id },
    });
  } catch (error) {
    console.error('Delete chat session error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: 'Unable to delete the chat session.',
    });
  }
};

// ─── PATCH /api/chat/:id/pin ─────────────────────────────────────────────────
// @desc   Toggle a chat session's pinned status (true -> false, false -> true)
// @access Private (JWT)
const toggleSessionPin = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found.',
      });
    }

    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: getUserId(req),
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found.',
      });
    }

    session.isPinned = !session.isPinned;
    // Pinning is bookkeeping, not activity — keep updatedAt untouched so the
    // "Previous 7 Days" grouping still reflects the last real exchange.
    await session.save({ timestamps: false });

    return res.status(200).json({
      success: true,
      message: session.isPinned ? 'Chat pinned.' : 'Chat unpinned.',
      data: {
        _id: session._id,
        isPinned: session.isPinned,
      },
    });
  } catch (error) {
    console.error('Toggle chat pin error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: 'Unable to update the pin status.',
    });
  }
};

module.exports = {
  createSession,
  getHistory,
  getSession,
  deleteSession,
  toggleSessionPin,
  MAX_MESSAGES_PER_SESSION,
};
