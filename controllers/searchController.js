const LegalCase = require('../models/LegalCase');

// ─── @desc    Search legal cases by query string
// ─── @route   GET /api/search?q=<query>
// ─── @access  Public
const searchCases = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    // ── Validate query ────────────────────────────────────────────────────────
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required. Use ?q=your+search+term',
      });
    }

    const searchTerm = q.trim();
    const skip = (Number(page) - 1) * Number(limit);

    let cases = [];
    let total = 0;
    let searchMode = '';

    // ── Strategy 1: MongoDB Full-Text Search ──────────────────────────────────
    // Preferred — uses the text index for fast, relevance-ranked results.
    try {
      const textQuery = { $text: { $search: searchTerm } };

      total = await LegalCase.countDocuments(textQuery);
      cases = await LegalCase.find(textQuery, {
        score: { $meta: 'textScore' }, // include relevance score
      })
        .sort({ score: { $meta: 'textScore' } }) // sort by relevance
        .skip(skip)
        .limit(Number(limit))
        .select('-fullText -__v'); // exclude heavy fields from list view

      searchMode = 'text-index';
    } catch (textSearchErr) {
      // ── Strategy 2: Regex Fallback ──────────────────────────────────────────
      // Used when the text index is not yet built or the search term is a
      // single character (MongoDB text search requires ≥ 2 characters).
      console.warn(
        '⚠️  Text search unavailable, falling back to regex:',
        textSearchErr.message
      );

      const regex = new RegExp(searchTerm, 'i');
      const regexQuery = {
        $or: [
          { caseTitle: regex },
          { citation: regex },
          { courtName: regex },
          { summary: regex },
          { keywords: regex },
        ],
      };

      total = await LegalCase.countDocuments(regexQuery);
      cases = await LegalCase.find(regexQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-fullText -__v');

      searchMode = 'regex-fallback';
    }

    // ── Response ──────────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      searchMode,
      query: searchTerm,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: cases.length,
      data: cases,
    });
  } catch (error) {
    console.error('❌ searchCases error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during search',
      error: error.message,
    });
  }
};

// ─── @desc    Get a single legal case by ID
// ─── @route   GET /api/search/:id
// ─── @access  Public
const getCaseById = async (req, res) => {
  try {
    const legalCase = await LegalCase.findById(req.params.id).select('-__v');

    if (!legalCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: legalCase,
    });
  } catch (error) {
    console.error('❌ getCaseById error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ─── @desc    Seed sample legal cases (dev/testing only)
// ─── @route   POST /api/search/seed
// ─── @access  Public (disable in production)
const seedCases = async (req, res) => {
  try {
    await LegalCase.deleteMany(); // clear existing

    const sampleCases = [
      {
        caseTitle: 'Roe v. Wade',
        citation: '410 U.S. 113 (1973)',
        courtName: 'United States Supreme Court',
        summary:
          'Landmark decision establishing that the Constitution of the United States generally protects the liberty to choose to have an abortion.',
        keywords: ['abortion', 'privacy', 'constitutional', 'fourteenth amendment'],
      },
      {
        caseTitle: 'Brown v. Board of Education',
        citation: '347 U.S. 483 (1954)',
        courtName: 'United States Supreme Court',
        summary:
          'Unanimous decision declaring that racial segregation in public schools is unconstitutional, overruling Plessy v. Ferguson.',
        keywords: ['segregation', 'education', 'civil rights', 'equal protection'],
      },
      {
        caseTitle: 'Miranda v. Arizona',
        citation: '384 U.S. 436 (1966)',
        courtName: 'United States Supreme Court',
        summary:
          'Decision requiring that suspects be informed of their rights before police interrogation, giving rise to the Miranda warning.',
        keywords: ['criminal law', 'fifth amendment', 'police', 'self-incrimination', 'rights'],
      },
      {
        caseTitle: 'Marbury v. Madison',
        citation: '5 U.S. 137 (1803)',
        courtName: 'United States Supreme Court',
        summary:
          'Foundational case establishing the principle of judicial review, allowing courts to invalidate laws that violate the Constitution.',
        keywords: ['judicial review', 'constitution', 'separation of powers', 'landmark'],
      },
      {
        caseTitle: 'Plessy v. Ferguson',
        citation: '163 U.S. 537 (1896)',
        courtName: 'United States Supreme Court',
        summary:
          'Decision that upheld racial segregation under the "separate but equal" doctrine, later overruled by Brown v. Board of Education.',
        keywords: ['segregation', 'civil rights', 'racial discrimination', 'fourteenth amendment'],
      },
    ];

    const inserted = await LegalCase.insertMany(sampleCases);

    return res.status(201).json({
      success: true,
      message: `✅ ${inserted.length} sample legal cases seeded successfully.`,
      data: inserted,
    });
  } catch (error) {
    console.error('❌ seedCases error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Seeding failed',
      error: error.message,
    });
  }
};

module.exports = { searchCases, getCaseById, seedCases };
