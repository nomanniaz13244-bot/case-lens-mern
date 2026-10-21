const LegalCase = require('../models/LegalCase');

// @desc    Add a new legal case
// @route   POST /api/admin/cases
// @access  Admin
const createCase = async (req, res) => {
  try {
    const {
      caseTitle,
      citation,
      courtName,
      judgeNames,
      decisionDate,
      caseType,
      summary,
      fullText,
      keywords,
      verdict,
    } = req.body;

    // Validate required fields
    if (!caseTitle || !courtName || !summary) {
      return res.status(400).json({
        success: false,
        message: 'Please provide caseTitle, courtName, and summary.',
      });
    }

    // Process keywords: support array or comma-separated string
    let parsedKeywords = [];
    if (Array.isArray(keywords)) {
      parsedKeywords = keywords.map((k) => (typeof k === 'string' ? k.trim() : String(k))).filter(Boolean);
    } else if (typeof keywords === 'string' && keywords.trim().length > 0) {
      parsedKeywords = keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
    }

    const newCase = await LegalCase.create({
      caseTitle: caseTitle.trim(),
      citation: citation ? citation.trim() : '',
      courtName: courtName.trim(),
      judgeNames: judgeNames ? judgeNames.trim() : '',
      decisionDate: decisionDate ? new Date(decisionDate) : undefined,
      caseType: caseType ? caseType.trim() : 'General',
      summary: summary.trim(),
      fullText: fullText ? fullText.trim() : '',
      keywords: parsedKeywords,
      verdict: verdict ? verdict.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Legal case created successfully.',
      data: newCase,
    });
  } catch (error) {
    console.error('Error in createCase:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating case.',
    });
  }
};

// @desc    Get all legal cases
// @route   GET /api/admin/cases
// @access  Admin
const getCases = async (req, res) => {
  try {
    const cases = await LegalCase.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: cases.length,
      data: cases,
    });
  } catch (error) {
    console.error('Error in getCases:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching cases.',
    });
  }
};

module.exports = {
  createCase,
  getCases,
};
