const mongoose = require('mongoose');

// Categories used by the Legal Dictionary. Kept in one place so the Mongoose
// enum, the API validation and the frontend dropdown stay aligned.
const CATEGORIES = ['Criminal', 'Civil', 'Constitutional', 'Family', 'General'];

const legalTermSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: [true, 'Term is required'],
      unique: true,
      trim: true,
      index: true,
    },

    englishDefinition: {
      type: String,
      required: [true, 'English definition is required'],
      trim: true,
    },

    urduExplanation: {
      type: String,
      required: [true, 'Urdu explanation is required'],
      trim: true,
    },

    example: {
      type: String,
      default: '',
      trim: true,
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a supported category',
      },
      trim: true,
      index: true,
    },

    relatedTerms: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const LegalTerm = mongoose.models.LegalTerm || mongoose.model('LegalTerm', legalTermSchema);

module.exports = LegalTerm;
module.exports.CATEGORIES = CATEGORIES;
