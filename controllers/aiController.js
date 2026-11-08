const LegalCase = require('../models/LegalCase');
const { generateAIResponse } = require('../services/aiService');
const {
  DEMO_BYPASS,
  getDemoCaseById,
  demoAnswer,
  seedDemoCases,
  listDemoCases,
} = require('../config/demoBypass');

const chatWithAI = async (req, res) => {
  // ⚠️ DEMO BYPASS: canned legal answer + demo cited cases, no DB queries.
  if (DEMO_BYPASS) {
    const message = String(req.body?.message ?? req.body?.question ?? req.body?.prompt ?? req.body?.query ?? '').trim();
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'A message is required to process the AI request.',
      });
    }
    seedDemoCases();
    const demoCases = listDemoCases();
    const citedCases = demoCases.slice(0, 3).map((legalCase, index) => ({
      caseTitle: legalCase.caseTitle,
      citation: legalCase.citation,
      courtName: legalCase.courtName,
      summary:
        String(legalCase.summary || '').replace(/\s+/g, ' ').trim().slice(0, 1500),
      reference: `[${index + 1}]`,
    }));
    const answer =
      `Demo Mode: Here is a legal analysis of your question — "${message}". ` +
      `The key considerations are the procedural compliance of the recovery/record and the applicable statutory framework. ` +
      `Refer to the cited precedents for how similar matters were decided. (Database bypassed for this demo session.)`;
    return res.status(200).json({
      success: true,
      message: 'Demo answer (Demo Bypass)',
      data: { question: message, answer, citedCases },
    });
  }

  try {
    const raw =
      req.body?.message ??
      req.body?.question ??
      req.body?.prompt ??
      req.body?.query ??
      '';
    const message = String(raw).trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'A message is required to process the AI request.',
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'The message is too long. Please limit it to 4000 characters.',
      });
    }

    const commonWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'case', 'cases',
      'do', 'for', 'from', 'give', 'how', 'in', 'is', 'me', 'of', 'on', 'tell',
      'that', 'the', 'their', 'this', 'to', 'what', 'which', 'who', 'with', 'about',
    ]);
    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchKeywords = [...new Set(
      message.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= 3 && !commonWords.has(word))
    )];

    const effectiveKeywords = searchKeywords.length > 0 ? searchKeywords : [message.trim()];
    const regexConditions = effectiveKeywords.flatMap((keyword) => {
      const pattern = { $regex: escapeRegex(keyword), $options: 'i' };
      return [
        { caseTitle: pattern },
        { summary: pattern },
        { keywords: pattern },
      ];
    });

    let relevantCases = regexConditions.length > 0
      ? await LegalCase.find({ $or: regexConditions })
          .limit(3)
          .select('caseTitle citation courtName summary keywords -_id')
      : [];

    if (relevantCases.length === 0) {
      relevantCases = await LegalCase.find({})
        .limit(3)
        .select('caseTitle citation courtName summary keywords -_id');
    }

    if (relevantCases.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          question: message,
          answer: 'No cases are currently available in the database, so I cannot provide a case-based answer yet.',
          citedCases: [],
        },
      });
    }

    const citedCases = relevantCases.map((legalCase, index) => {
      const summary = String(legalCase.summary || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1500);

      return {
        caseTitle: legalCase.caseTitle,
        citation: legalCase.citation,
        courtName: legalCase.courtName,
        summary,
        reference: `[${index + 1}]`,
      };
    });

    const contextString = citedCases
      .map((legalCase) => `Title: ${legalCase.caseTitle}\nSummary: ${legalCase.summary}`)
      .join('\n\n');
    console.log('Context sent to AI:\n', contextString);

    const answer = await generateAIResponse(
      "You are a legal AI assistant. You MUST answer the user's question using ONLY the provided Context below. If the answer is not in the context, say 'I could not find this information in the database.' Do NOT use your general knowledge.",
      contextString,
      { userPrompt: message, temperature: 0.2, maxTokens: 1000 }
    );

    return res.status(200).json({
      success: true,
      data: {
        question: message,
        answer,
        citedCases,
      },
    });
  } catch (error) {
    console.error('AI provider error:', error?.message || String(error));
    if (error?.stack) console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Server error while processing the AI request.',
    });
  }
};

const caseSpecificChat = async (req, res) => {
  // ⚠️ DEMO BYPASS: answer from the in-memory case store — no DB, no AI provider.
  if (DEMO_BYPASS) {
    const { caseId, question } = req.body;
    if (!caseId || !String(question || '').trim()) {
      return res.status(400).json({ success: false, message: 'caseId and question are required.' });
    }
    const demoCase = getDemoCaseById(caseId);
    // Unknown demo IDs still get a usable answer so the chat box never dead-ends.
    return res.status(200).json({
      success: true,
      message: 'Demo answer (Demo Bypass)',
      data: { answer: demoAnswer(question, demoCase) },
    });
  }

  try {
    const { caseId, question } = req.body;
    if (!caseId || !String(question || '').trim()) {
      return res.status(400).json({ success: false, message: 'caseId and question are required.' });
    }
    const legalCase = await LegalCase.findById(caseId);
    if (!legalCase) return res.status(404).json({ success: false, message: 'Case not found.' });

    const laws = Array.isArray(legalCase.legalLaws) && legalCase.legalLaws.length
      ? legalCase.legalLaws
      : (legalCase.lawsApplied || []);
    const context = [
      `Title: ${legalCase.caseTitle || ''}`,
      `Summary: ${legalCase.summary || ''}`,
      `Facts: ${legalCase.facts || 'Not available'}`,
      `Legal Laws: ${(laws || []).join(', ') || 'Not available'}`,
      `Full Text: ${legalCase.fullText || ''}`,
      `Verdict: ${legalCase.verdict || ''}`,
    ].join('\n');

    const answer = await generateAIResponse(
      'You are a Pakistani legal assistant. Answer ONLY using the provided context for this specific case. If the answer is not present in the context, say "I could not find this information in the case data." Do not use general knowledge, external case databases, or information from other cases.',
      context,
      { userPrompt: String(question).trim(), temperature: 0.2, maxTokens: 1000 }
    );
    return res.status(200).json({ success: true, data: { answer } });
  } catch (error) {
    console.error('AI provider error:', error?.message || String(error));
    if (error?.stack) console.error(error.stack);
    return res.status(500).json({ success: false, message: error.message || 'Unable to answer the case question.' });
  }
};

// ─── Simple Case Chat (no RAG — one DB read + one AI call) ────────────────────
// Frontend sends { caseId, question }; we fetch the case, build a strict
// grounded prompt, and return Groq's answer. No keyword search, no citations.
const simpleCaseChat = async (req, res) => {
  try {
    const { caseId, question } = req.body;

    if (!caseId || !String(question || '').trim()) {
      return res.status(400).json({ success: false, message: 'caseId and question are required.' });
    }

    const legalCase = await LegalCase.findById(caseId);
    if (!legalCase) return res.status(404).json({ success: false, message: 'Case not found.' });

    const laws = Array.isArray(legalCase.legalLaws) && legalCase.legalLaws.length
      ? legalCase.legalLaws
      : (legalCase.lawsApplied || []);

    const strictPrompt =
      `You are a legal assistant. Answer the user's question based ONLY on this case data: ` +
      `Title: ${legalCase.caseTitle}, Facts: ${legalCase.facts || 'Not available'}, ` +
      `Summary: ${legalCase.summary || 'Not available'}, ` +
      `Laws: ${(laws || []).join(', ') || 'Not available'}. ` +
      `If the answer is not in the data, say 'I cannot find this in the case.'`;

    const answer = await generateAIResponse(
      strictPrompt,
      '',
      { userPrompt: String(question).trim(), temperature: 0.2, maxTokens: 600 }
    );

    return res.status(200).json({ success: true, data: { answer } });
  } catch (error) {
    console.error('Simple case chat error:', error?.message || String(error));
    return res.status(500).json({ success: false, message: error.message || 'Unable to answer the case question.' });
  }
};

module.exports = { chatWithAI, caseSpecificChat, simpleCaseChat };
