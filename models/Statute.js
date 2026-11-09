const mongoose = require('mongoose');

// ─── Statute: a searchable Pakistani law / statute section ────────────────────
// Stored independently of LegalCase so lawyers can research laws without an
// uploaded case.
const statuteSchema = new mongoose.Schema(
  {
    // e.g. "Section 302" or "Article 9"
    sectionNumber: {
      type: String,
      required: [true, 'Section number is required'],
      trim: true,
    },
    // e.g. "Pakistan Penal Code, 1860"
    actName: {
      type: String,
      required: [true, 'Act name is required'],
      trim: true,
    },
    // Short heading, e.g. "Punishment for qatl-i-amd (murder)"
    title: {
      type: String,
      trim: true,
      default: '',
    },
    // The operative text / substance of the section
    sectionText: {
      type: String,
      required: [true, 'Section text is required'],
    },
    // Category label for grouping, e.g. "Criminal Law", "Evidence", "Procedure"
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    keywords: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

statuteSchema.index(
  { sectionNumber: 'text', actName: 'text', title: 'text', sectionText: 'text', keywords: 'text' },
  { name: 'statute_search_index' }
);

module.exports = mongoose.model('Statute', statuteSchema);
