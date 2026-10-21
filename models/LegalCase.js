const mongoose = require('mongoose');

const LegalCaseSchema = new mongoose.Schema(
  {
    caseTitle: {
      type: String,
      required: [true, 'Case title is required'],
      trim: true,
    },

    citation: {
      type: String,
      required: [true, 'Citation is required'],
      trim: true,
      unique: true,
    },

    courtName: {
      type: String,
      required: [true, 'Court name is required'],
      trim: true,
    },

    summary: {
      type: String,
      required: [true, 'Case summary is required'],
    },

    fullText: {
      type: String,
      default: '',
    },

    keywords: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

// ─── Text Index ───────────────────────────────────────────────────────────────
// Enables MongoDB full-text search across all major text fields.
// Weights control relevance ranking: higher = more relevant in results.
LegalCaseSchema.index(
  {
    caseTitle: 'text',
    citation: 'text',
    courtName: 'text',
    summary: 'text',
    fullText: 'text',
    keywords: 'text',
  },
  {
    weights: {
      caseTitle: 10,
      keywords: 8,
      citation: 6,
      courtName: 4,
      summary: 3,
      fullText: 1,
    },
    name: 'legal_case_text_index',
  }
);

module.exports = mongoose.model('LegalCase', LegalCaseSchema);
