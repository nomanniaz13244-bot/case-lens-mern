const LegalCase = require('../models/LegalCase');
const Statute = require('../models/Statute');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── @desc    Global legal research search: statutes + court judgments ───────
// ─── @route   GET /api/research/search?query=<term>
// ─── @access  Public
const searchResearch = async (req, res) => {
  try {
    const query = String(req.query?.query ?? req.query?.q ?? '').trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required. Use ?query=your+search+term',
      });
    }

    console.log('Research Query:', query);

    const words = query
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 3);
    const keywords = [...new Set(words.length ? words : [query.toLowerCase()])];

    const statuteConditions = keywords.flatMap((keyword) => {
      const pattern = { $regex: escapeRegex(keyword), $options: 'i' };
      return [
        { sectionNumber: pattern },
        { actName: pattern },
        { title: pattern },
        { sectionText: pattern },
        { keywords: pattern },
      ];
    });
    const caseConditions = keywords.flatMap((keyword) => {
      const pattern = { $regex: escapeRegex(keyword), $options: 'i' };
      return [
        { caseTitle: pattern },
        { summary: pattern },
        { facts: pattern },
        { legalLaws: pattern },
      ];
    });

    const [statutes, judgments] = await Promise.all([
      statuteConditions.length
        ? Statute.find({ $or: statuteConditions }).limit(10).select('-__v -keywords').lean()
        : Promise.resolve([]),
      caseConditions.length
        ? LegalCase.find({ $or: caseConditions })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('caseTitle citation courtName summary facts verdict legalLaws createdAt')
            .lean()
        : Promise.resolve([]),
    ]);

    console.log('Statutes Found:', statutes.length);
    console.log('Judgments Found:', judgments.length);

    return res.status(200).json({
      success: true,
      query,
      counts: { statutes: statutes.length, judgments: judgments.length },
      statutes,
      judgments,
    });
  } catch (error) {
    console.error('Research search error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: error?.message || 'Server error while searching the legal research module.',
    });
  }
};

module.exports = { searchResearch };
