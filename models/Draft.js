const mongoose = require('mongoose');

// Document types supported by the Legal Drafting module. Kept in one place so
// the API validation, the Mongoose enum and the frontend dropdown stay aligned.
const DOCUMENT_TYPES = [
  'Legal Notice',
  'Civil Petition',
  'Constitutional Petition',
  'Court Application',
  'Basic Agreement',
];

const draftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A draft must belong to a user'],
    },

    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      enum: {
        values: DOCUMENT_TYPES,
        message: '{VALUE} is not a supported document type',
      },
      trim: true,
    },

    instructions: {
      type: String,
      required: [true, 'Instructions are required'],
      trim: true,
    },

    generatedContent: {
      type: String,
      required: [true, 'Draft content is required'],
      default: '',
    },

    // Audit trail for AI rewrites ("Improve", "Simplify", etc.).
    editHistory: [
      {
        instruction: { type: String, trim: true, default: '' },
        content: { type: String, default: '' },
        editedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

// Fast lookup of a user's drafts, newest first.
draftSchema.index({ userId: 1, updatedAt: -1 });

const Draft = mongoose.model('Draft', draftSchema);

module.exports = Draft;
module.exports.DOCUMENT_TYPES = DOCUMENT_TYPES;
