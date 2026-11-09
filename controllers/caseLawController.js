const LegalCase = require('../models/LegalCase');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── @desc    Search Pakistani court judgments (precedents) ──────────────────
// ─── @route   GET /api/case-laws/search?query=<term>&court=<SC|HIGH COURT>&year=<YYYY>&citation=<term>
// ─── @access  Public
const searchCaseLaws = async (req, res) => {
  try {
    const query = String(req.query?.query ?? req.query?.q ?? '').trim();
    const court = String(req.query?.court ?? '').trim();
    const year = String(req.query?.year ?? '').trim();
    const citationQuery = String(req.query?.citation ?? '').trim();

    console.log('Case Laws Search:', JSON.stringify({ query, court, year, citation: citationQuery }));

    const conditions = [];

    // Free-text search over the case text index; regex fallback keeps results
    // truthful even if the text index is unavailable.
    if (query) {
      let matched = null;
      try {
        matched = await LegalCase
          .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(25)
          .select('caseTitle citation courtName summary facts createdAt judgmentDate')
          .lean();
        if (matched.length === 0) matched = null;
      } catch (textIndexError) {
        matched = null;
      }

      if (!matched) {
        const pattern = { $regex: escapeRegex(query), $options: 'i' };
        matched = await LegalCase
          .find({ $or: [{ caseTitle: pattern }, { citation: pattern }, { summary: pattern }, { fullText: pattern }] })
          .limit(15)
          .select('caseTitle citation courtName summary facts createdAt judgmentDate')
          .lean();
      }

      // Apply the structured filters (court / year / citation) on top of the
      // text-matched set in-memory — they are narrow, secondary filters.
      let results = matched.filter((item) =>
        !court || new RegExp(escapeRegex(court), 'i').test(`${item.courtName || ''} ${item.caseTitle || ''}`)
      ).filter((item) =>
        !year || new RegExp(`(^|\\D)${year}(\\D|$)`).test(String(item.citation || '')) ||
          new Date(item.createdAt || Date.now()).getFullYear() === Number(year)
      ).filter((item) =>
        !citationQuery || new RegExp(escapeRegex(citationQuery), 'i').test(item.citation || '')
      );

      // If structured filters eliminated everything, try filter-only search so
      // the UI still reflects what the DB genuinely has.
      if (results.length === 0) {
        const dbConditions = [];
        if (court) {
          const courtPattern = { $regex: escapeRegex(court), $options: 'i' };
          dbConditions.push({ caseTitle: courtPattern }, { courtName: courtPattern });
        }
        if (citationQuery) dbConditions.push({ citation: { $regex: escapeRegex(citationQuery), $options: 'i' } });
        if (year) dbConditions.push({ citation: { $regex: `(^|\\D)${year}(\\D|$)` } });

        if (dbConditions.length > 0) {
          const filterOnly = await LegalCase.find({ $and: dbConditions })
            .limit(15)
            .select('caseTitle citation courtName summary facts createdAt judgmentDate')
            .lean();
          results = filterOnly;
        }
      }

      if (matched.length === 0 && !court && !year && !citationQuery && results.length === 0) {
        results = [];
      }

      conditions.push(...results);
    } else {
      // No free-text query — filter-only search.
      const dbConditions = [];
      if (court) {
        const courtPattern = { $regex: escapeRegex(court), $options: 'i' };
        dbConditions.push({ $or: [{ caseTitle: courtPattern }, { courtName: courtPattern }] });
      }
      if (citationQuery) dbConditions.push({ citation: { $regex: escapeRegex(citationQuery), $options: 'i' } });
      if (year) dbConditions.push({ citation: { $regex: `(^|\\D)${year}(\\D|$)` } });

      const results = dbConditions.length
        ? await LegalCase.find({ $and: dbConditions })
            .sort({ createdAt: -1 })
            .limit(15)
            .select('caseTitle citation courtName summary facts createdAt judgmentDate')
            .lean()
        : await LegalCase.find({})
            .sort({ createdAt: -1 })
            .limit(15)
            .select('caseTitle citation courtName summary facts createdAt judgmentDate')
            .lean();
      conditions.push(...results);
    }

    console.log('Judgments Found:', conditions.length);

    return res.status(200).json({
      success: true,
      counts: { judgments: conditions.length },
      judgments: conditions,
    });
  } catch (error) {
    console.error('Case laws search error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: error?.message || 'Server error while searching case laws.',
    });
  }
};

// ─── @desc    Find precedents similar to a given case ─────────────────────────
// ─── @route   GET /api/case-laws/similar/:id
// ─── @access  Public
const getSimilarCases = async (req, res) => {
  try {
    const caseId = req.params.id;
    if (!caseId || caseId === 'undefined' || !/^[a-f\d]{24}$/i.test(caseId)) {
      return res.status(400).json({ success: false, message: 'A valid case id is required.' });
    }
    const source = await LegalCase.findById(caseId).lean();
    if (!source) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    // Build search keywords from the case's facts, summary and laws applied.
    const sourceText = [
      source.caseTitle,
      source.summary,
      source.facts,
      Array.isArray(source.legalLaws) ? source.legalLaws.join(' ') : String(source.legalLaws || ''),
    ].filter(Boolean).join(' ');

    const commonWords = new Set([
      'the', 'and', 'was', 'were', 'that', 'this', 'with', 'from', 'have', 'has',
      'his', 'her', 'who', 'for', 'not', 'all', 'any', 'are', 'case', 'court',
      'which', 'had', 'their', 'shall', 'under', 'against', 'accused', 'section',
    ]);
    const keywords = [...new Set(
      sourceText.toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= 4 && !commonWords.has(word))
    )].slice(0, 12);

    let similarCases = [];
    if (keywords.length > 0) {
      try {
        similarCases = await LegalCase
          .find({ _id: { $ne: source._id }, $text: { $search: keywords.join(' ') } }, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(5)
          .select('caseTitle citation courtName summary facts createdAt judgmentDate')
          .lean();
      } catch (textIndexError) {
        similarCases = [];
      }

      if (similarCases.length === 0) {
        const regexConditions = keywords.flatMap((keyword) => [
          { caseTitle: { $regex: escapeRegex(keyword), $options: 'i' } },
          { summary: { $regex: escapeRegex(keyword), $options: 'i' } },
          { facts: { $regex: escapeRegex(keyword), $options: 'i' } },
        ]);
        similarCases = await LegalCase
          .find({ _id: { $ne: source._id }, $or: regexConditions })
          .limit(5)
          .select('caseTitle citation courtName summary facts createdAt judgmentDate')
          .lean();
      }
    }

    console.log('Similar Cases for', source.caseTitle?.slice(0, 50), '→', similarCases.length);

    return res.status(200).json({
      success: true,
      count: similarCases.length,
      basedOnKeywords: keywords.slice(0, 8),
      similarCases,
    });
  } catch (error) {
    console.error('Similar cases error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: error?.message || 'Server error while finding similar cases.',
    });
  }
};

module.exports = { searchCaseLaws, getSimilarCases };
