const LegalCase = require('../models/LegalCase');
const csv = require('csv-parser');
const { createWorker } = require('tesseract.js');
const { PDFParse } = require('pdf-parse');
const { Readable } = require('stream');
const { generateAIResponse } = require('../services/aiService');

const MAX_IMPORT_ROWS = 5000;
const REQUIRED_CSV_HEADERS = ['caseTitle', 'courtName', 'summary'];

const parseCsvBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const rows = [];
    let headers = [];
    const parser = csv({
      strict: true,
      mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, ''),
    });

    parser.on('headers', (parsedHeaders) => {
      headers = parsedHeaders;
    });
    parser.on('data', (row) => {
      if (rows.length >= MAX_IMPORT_ROWS) {
        parser.destroy(new Error(`CSV files cannot contain more than ${MAX_IMPORT_ROWS} cases.`));
        return;
      }
      rows.push(row);
    });
    parser.on('error', reject);
    parser.on('end', () => resolve({ headers, rows }));

    Readable.from([buffer]).pipe(parser);
  });

// @desc    Import legal cases from a CSV file
// @route   POST /api/admin/cases/bulk-import
// @access  Admin
const bulkImportCases = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file using the "file" field.',
      });
    }

    let parsedCsv;
    try {
      parsedCsv = await parseCsvBuffer(req.file.buffer);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Could not parse CSV file: ${error.message}`,
      });
    }

    const { headers, rows } = parsedCsv;
    const missingHeaders = REQUIRED_CSV_HEADERS.filter((header) => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `CSV is missing required columns: ${missingHeaders.join(', ')}.`,
      });
    }

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The CSV file contains no case rows to import.',
      });
    }

    const importedCases = [];
    const seenCitations = new Set();
    const rowErrors = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const caseData = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, value.trim()])
      );

      const missingValues = REQUIRED_CSV_HEADERS.filter((field) => !caseData[field]);
      if (missingValues.length > 0) {
        rowErrors.push(`Row ${rowNumber}: missing ${missingValues.join(', ')}.`);
        return;
      }

      const citation = caseData.citation || `PAK-BULK-${String(index + 1).padStart(5, '0')}`;
      if (seenCitations.has(citation)) {
        rowErrors.push(`Row ${rowNumber}: duplicate citation "${citation}" in the CSV.`);
        return;
      }
      seenCitations.add(citation);

      let decisionDate;
      if (caseData.decisionDate) {
        decisionDate = new Date(caseData.decisionDate);
        if (Number.isNaN(decisionDate.getTime())) {
          rowErrors.push(`Row ${rowNumber}: invalid decisionDate "${caseData.decisionDate}".`);
          return;
        }
      }

      importedCases.push({
        caseTitle: caseData.caseTitle,
        citation,
        courtName: caseData.courtName,
        judgeNames: caseData.judgeNames || '',
        decisionDate,
        caseType: caseData.caseType || 'General',
        summary: caseData.summary,
        fullText: caseData.fullText || '',
        keywords: caseData.keywords
          ? caseData.keywords.split(/[;|]/).map((keyword) => keyword.trim()).filter(Boolean)
          : [],
        verdict: caseData.verdict || '',
      });
    });

    if (rowErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'The CSV contains invalid rows. No cases were imported.',
        errors: rowErrors,
      });
    }

    const existingCases = await LegalCase.find({
      citation: { $in: Array.from(seenCitations) },
    })
      .select('citation -_id')
      .lean();
    if (existingCases.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Some citations already exist. No cases were imported.',
        citations: existingCases.map((legalCase) => legalCase.citation),
      });
    }

    const insertedCases = await LegalCase.insertMany(importedCases);

    return res.status(201).json({
      success: true,
      message: `${insertedCases.length} legal case(s) imported successfully.`,
      count: insertedCases.length,
    });
  } catch (error) {
    console.error('Error in bulkImportCases:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A citation was added by another request during import; check the case list for partial results.',
        importedCount: error.insertedDocs?.length || error.result?.insertedCount || 0,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while importing cases.',
    });
  }
};

// Extract text from an uploaded PDF, image, or plain-text file.
const extractDocumentText = async (file) => {
  const mimeType = file.mimetype || '';
  if (mimeType === 'application/pdf' || file.originalname.toLower?.().endsWith('.pdf')) {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const result = await parser.getText();
      return result.text || '';
    } finally {
      await parser.destroy();
    }
  }

  if (mimeType.startsWith('image/')) {
    const worker = await createWorker('eng');
    try {
      const result = await worker.recognize(file.buffer);
      return result.data.text || '';
    } finally {
      await worker.terminate();
    }
  }

  return file.buffer.toString('utf8');
};

const parseAnalysisJson = (content) => {
  const fallback = {
    summary: 'Could not analyze the case automatically.',
    facts: 'No facts extracted.',
    legalLaws: [],
    citation: 'N/A',
    pastCasesKeywords: [],
  };

  const rawResponse = String(content || '');
  const cleaned = rawResponse
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    console.error('AI response was not valid JSON. Raw response:', rawResponse);
    return fallback;
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (error) {
    console.error('Failed to parse AI response JSON. Raw response:', rawResponse);
    console.error('AI JSON parse error:', error.message);
    return fallback;
  }
};

// @desc    Analyze uploaded legal text and create a workspace case
// @route   POST /api/workspace/create
// @access  Protected
const createWorkspaceCase = async (req, res) => {
  try {
    // New contract: { caseTitle, caseText } sent separately. `text`/`fullText`
    // remain accepted aliases for older clients.
    let sourceText = String(
      req.body?.caseText || req.body?.text || req.body?.fullText || ''
    ).trim();
    if (req.file) sourceText = (await extractDocumentText(req.file)).trim();

    const caseTitle = String(req.body?.caseTitle || req.body?.title || '').trim();
    // A workspace case without a title breaks list display/search — required.
    if (!caseTitle) {
      return res.status(400).json({ success: false, message: 'Case title is required.' });
    }

    if (!sourceText) {
      return res.status(400).json({ success: false, message: 'Provide legal text or upload a PDF/image file.' });
    }
    const prompt = `You are a Pakistani legal AI. You MUST output a JSON object with EXACTLY these keys and value types: { summary: String, citation: String, facts: String, legalIssues: String, lawsApplied: String, precedentComparison: String, supportingContradicting: String, opposingArguments: String, strengthsWeaknesses: String }. For "legalIssues" and "lawsApplied", write each item on its own line prefixed with "- ". For "citation", extract the case's legal citation if it appears in the text (e.g. "2024 PECA 20" or "PLD 2024 SC 123") — if none is present, return an empty string "". Return ONLY the raw JSON object — no markdown formatting like \`\`\`json fences, no explanations, and no keys outside this list.
{
  "summary": "Brief summary of the case",
  "facts": "Detailed facts and timeline of the case",
  "legalIssues": "- Issue 1\\n- Issue 2",
  "lawsApplied": "- Law or statute 1\\n- Law or statute 2",
  "precedentComparison": "How this case compares to similar past cases",
  "supportingContradicting": "Evidence supporting and contradicting the claims",
  "opposingArguments": "What the opposing counsel would argue",
  "strengthsWeaknesses": "Strengths and weaknesses of the current case"
}`;
    const aiRawResponse = await generateAIResponse(
      prompt,
      sourceText.slice(0, 12000),
      { temperature: 0.1, maxTokens: 2800, json: true }
    );
    console.log('RAW AI:', aiRawResponse);
    const parsedData = parseAnalysisJson(aiRawResponse);
    console.log('PARSED DATA:', parsedData);

    const defaultIfMissing = (value, sourceFallback) =>
      String(value || '').trim() || String(sourceFallback || '').trim() || 'Not available';
    // Strings per the strict contract; tolerate an array response defensively.
    const readString = (key, sourceFallback) => {
      const value = parsedData[key];
      if (value == null) return defaultIfMissing(null, sourceFallback);
      if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join('\n') || defaultIfMissing(value, sourceFallback);
      return defaultIfMissing(String(value), sourceFallback);
    };

    const summary = readString('summary', sourceText.slice(0, 500));
    const facts = readString('facts');
    const caseLaws = readString('caseLaws');
    const precedentComparison = readString('precedentComparison');
    const supportingContradicting = readString('supportingContradicting');
    const opposingArguments = readString('opposingArguments');
    const strengthsWeaknesses = readString('strengthsWeaknesses');
    // legalIssues / lawsApplied saved as arrays (schema contract), parsed from
    // the lines the AI produced — or the literal string if it ignored the format.
    const normalizeList = (value) => {
      if (value == null) return [];
      const asString = Array.isArray(value)
        ? value.map((item) => String(item).trim()).filter(Boolean).join('\n')
        : String(value).trim();
      if (!asString) return [];
      return asString.split(/\n|;/)
        .map((item) => item.trim().replace(/^[-*\d.]+\s*/, ''))
        .filter(Boolean);
    };
    const legalIssues = normalizeList(parsedData.legalIssues);
    const lawsApplied = normalizeList(parsedData.lawsApplied);
    const legalLaws = lawsApplied.length
      ? lawsApplied
      : (caseLaws && caseLaws !== 'Not available'
          ? caseLaws.split(/[;\n]/).map((item) => item.trim()).filter(Boolean)
          : []);
    const citations = caseLaws;
    // Citation: only a user-provided citation or one the AI extracted from the
    // case text. Never a fallback string — an empty string is valid now that
    // the unique index on citation is dropped.
    const aiCitation = typeof parsedData.citation === 'string' ? parsedData.citation.trim() : '';
    const providedCitation = String(req.body?.citation || '').trim();
    const citation = providedCitation || aiCitation || '';
    const keyFacts = facts ? facts.split(/[;\n]/).map((item) => item.trim()).filter(Boolean) : [];
    const timeline = facts ? [facts] : [];

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchTerms = [...keyFacts, ...legalLaws, summary]
      .flatMap((value) => String(value).split(/\s+/))
      .map((value) => value.replace(/[^\w.-]/g, ''))
      .filter((value) => value.length >= 4)
      .filter((value, index, values) => values.indexOf(value.toLowerCase()) === index);
    const keywordConditions = searchTerms.slice(0, 12).flatMap((keyword) => {
      const pattern = { $regex: escapeRegex(keyword), $options: 'i' };
      return [{ caseTitle: pattern }, { summary: pattern }, { keywords: pattern }, { legalLaws: pattern }];
    });
    const similarCases = keywordConditions.length
      ? await LegalCase.find({ $or: keywordConditions })
          .select('caseTitle citation courtName summary verdict')
          .limit(3)
          .lean()
      : [];
    const pastCases = similarCases.map((item) => ({
      id: item._id,
      caseTitle: item.caseTitle,
      citation: item.citation,
      courtName: item.courtName,
      summary: item.summary,
      verdict: item.verdict,
    }));

    const newCase = await LegalCase.create({
      caseTitle,
      citation,
      courtName: String(req.body?.courtName || 'Pakistan').trim(),
      caseType: String(req.body?.caseType || 'AI Workspace').trim(),
      summary,
      fullText: sourceText,
      keywords: searchTerms.slice(0, 12),
      facts,
      keyFacts,
      timeline,
      citations,
      caseLaws,
      precedentComparison,
      supportingContradicting,
      opposingArguments,
      strengthsWeaknesses,
      legalIssues,
      legalLaws,
      lawsApplied,
      pastCases,
      createdBy: req.user.id || req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Workspace case created successfully.',
      caseId: newCase._id,
      data: newCase,
    });
  } catch (error) {
    console.error('createWorkspaceCase error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error while creating workspace case.' });
  }
};

const createCaseWithAIAnalysis = createWorkspaceCase;

// @desc    Get a case by ID
// @route   GET /api/workspace/case/:caseId
// @access  Protected
const getCaseById = async (req, res) => {
  try {
    const legalCase = await LegalCase.findById(req.params.caseId).lean();
    if (!legalCase) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    return res.status(200).json({
      success: true,
      data: legalCase,
    });
  } catch (error) {
    console.error('getCaseById error:', error);
    if (error?.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid case ID.' });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching the case.',
    });
  }
};

// @desc    Get cases created by the logged-in user
// @route   GET /api/workspace/my-cases
// @access  Protected
const getUserCases = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const cases = await LegalCase.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: cases.length,
      data: cases,
    });
  } catch (error) {
    console.error('getUserCases error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching your cases.',
    });
  }
};

// @desc    Delete a case owned by the logged-in user
// @route   DELETE /api/cases/:id
// @access  Protected
const deleteUserCase = async (req, res) => {
  try {
    console.log('Delete Request for Case ID:', req.params.id);
    const caseId = req.params.id;
    if (!caseId) {
      return res.status(400).json({ success: false, message: 'Case id is required.' });
    }

    const legalCase = await LegalCase.findById(caseId).select('createdBy').lean();
    if (!legalCase) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    // Ownership guard: a user may only delete their own case.
    const requesterId = String(req.user.id || req.user._id || '');
    const ownerId = String(legalCase.createdBy?._id || legalCase.createdBy || '');
    if (!requesterId || !ownerId || requesterId !== ownerId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own cases.' });
    }

    await LegalCase.findByIdAndDelete(caseId);
    console.log('Case deleted:', caseId, 'by user:', requesterId);

    return res.status(200).json({ success: true, message: 'Case deleted successfully' });
  } catch (error) {
    console.error('Delete case error:', error?.message || String(error));
    return res.status(500).json({ success: false, message: error?.message || 'Server error while deleting the case.' });
  }
};

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
  bulkImportCases,
  createCaseWithAIAnalysis,
  createWorkspaceCase,
  getUserCases,
  getCaseById,
  deleteUserCase,
};
