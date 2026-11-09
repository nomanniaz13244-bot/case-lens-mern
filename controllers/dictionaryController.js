const LegalTerm = require('../models/LegalTerm');

const { CATEGORIES } = LegalTerm;

// Escape user input before using it inside a RegExp, so a query like "(" or
// ".*" cannot throw or match everything unexpectedly.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeCategory = (value) => {
  const input = String(value || '').trim();
  if (!input) return '';
  return CATEGORIES.find((category) => category.toLowerCase() === input.toLowerCase()) || '';
};

// ─── @desc    Search legal terms by name and/or category
// ─── @route   GET /api/dictionary/search?query=bail&category=Criminal
// ─── @access  Public
const searchTerms = async (req, res) => {
  try {
    const { query = '', category = '', limit = 60 } = req.query;

    const filter = {};

    const trimmedQuery = String(query || '').trim();

    const trimmedCategory = String(category || '').trim();
    if (trimmedCategory) {
      const normalizedCategory = normalizeCategory(trimmedCategory);
      if (!normalizedCategory) {
        return res.status(400).json({
          success: false,
          message: `Unknown category "${trimmedCategory}". Use one of: ${CATEGORIES.join(', ')}.`,
        });
      }
      filter.category = normalizedCategory;
    }

    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 60, 1), 100);

    let terms;

    if (trimmedQuery) {
      // Flexible match: the typed word is looked for in the term name AND in the
      // English definition, so "murder" also surfaces related entries whose
      // definition mentions murder. Name matches are returned first.
      const pattern = { $regex: escapeRegex(trimmedQuery), $options: 'i' };

      const termMatches = await LegalTerm.find({ ...filter, term: pattern })
        .sort({ term: 1 })
        .limit(safeLimit)
        .lean();

      const remaining = safeLimit - termMatches.length;
      const relatedMatches =
        remaining > 0
          ? await LegalTerm.find({
              ...filter,
              englishDefinition: pattern,
              term: { $not: pattern },
            })
              .sort({ term: 1 })
              .limit(remaining)
              .lean()
          : [];

      terms = [...termMatches, ...relatedMatches];
    } else {
      terms = await LegalTerm.find(filter).sort({ term: 1 }).limit(safeLimit).lean();
    }

    // An explicit not-found signal lets the frontend offer an AI-generated
    // definition instead of showing a bare empty list.
    if (trimmedQuery && terms.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        notFoundInLocalDb: true,
        query: trimmedQuery,
        message: `"${trimmedQuery}" was not found in the local legal dictionary.`,
        categories: CATEGORIES,
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      count: terms.length,
      notFoundInLocalDb: false,
      categories: CATEGORIES,
      data: terms,
    });
  } catch (error) {
    console.error('❌ dictionary searchTerms error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while searching the legal dictionary.',
      error: error.message,
    });
  }
};

// ─── @desc    Get a single legal term with full details
// ─── @route   GET /api/dictionary/term/:term
// ─── @access  Public
const getTermByName = async (req, res) => {
  try {
    let rawTerm = '';

    try {
      rawTerm = decodeURIComponent(req.params.term || '').trim();
    } catch {
      rawTerm = String(req.params.term || '').trim();
    }

    if (!rawTerm) {
      return res.status(400).json({
        success: false,
        message: 'A term name is required.',
      });
    }

    const term = await LegalTerm.findOne({
      term: { $regex: `^${escapeRegex(rawTerm)}$`, $options: 'i' },
    }).lean();

    if (!term) {
      return res.status(404).json({
        success: false,
        message: `Term "${rawTerm}" not found.`,
      });
    }

    return res.status(200).json({ success: true, data: term });
  } catch (error) {
    console.error('❌ getTermByName error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while loading the legal term.',
      error: error.message,
    });
  }
};

module.exports = { searchTerms, getTermByName };
