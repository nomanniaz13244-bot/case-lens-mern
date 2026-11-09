const mongoose = require('mongoose');

// One message inside a chat session. `_id` is disabled — messages are only
// ever referenced by their position in the parent session's array.
const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, 'A message role is required'],
      enum: {
        values: ['user', 'assistant', 'ai'],
        message: '{VALUE} is not a supported message role',
      },
    },

    text: {
      type: String,
      required: [true, 'A message text is required'],
      default: '',
    },

    // Assistant messages only — the case cards shown under an answer.
    citedCases: {
      type: Array,
      default: [],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A chat session must belong to a user'],
      index: true,
    },

    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LegalCase',
      default: null,
      index: true,
    },

    // Auto-generated from the first user message (truncated), or 'New Chat'
    // until the first exchange happens.
    title: {
      type: String,
      trim: true,
      default: 'New Chat',
      maxlength: [120, 'Chat titles are limited to 120 characters'],
    },

    // Pinned chats float to the top of the history sidebar.
    isPinned: {
      type: Boolean,
      default: false,
    },

    messages: {
      type: [chatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

// History sidebar ordering: a user's sessions, pinned first then most
// recently active.
chatSessionSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });
chatSessionSchema.index({ userId: 1, caseId: 1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;
