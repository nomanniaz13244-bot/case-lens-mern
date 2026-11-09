const LegalCase = require('../models/LegalCase');
const { generateAIResponse } = require('../services/aiService');

const CASE_NOT_FOUND_NOTE =
  'I could not find any relevant cases in the repository for your query. Could you please provide more details?';

const chatWithAI = async (req, res) => {
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

    const query = message;
    console.log('Global Search Query:', query);

    // Too-short input ("D", "ok", "?") — searching would only produce noise,
    // so ask for a complete question instead of guessing.
    if (message.length < 5) {
      return res.status(200).json({
        success: true,
        data: {
          question: message,
          answer: 'Please ask a complete question so I can search the case repository effectively.',
          citedCases: [],
        },
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

    // ─── Global RAG search ──────────────────────────────────────────────────
    // 1) Ranked full-text search (uses the collection's text index), then
    // 2) keyword regex fallback. There is NO random-case fallback: if nothing
    // matches, the assistant honestly reports that no relevant cases exist.
    let relevantCases = [];
    try {
      relevantCases = await LegalCase
        .find(
          { $text: { $search: effectiveKeywords.join(' ') } },
          { score: { $meta: 'textScore' } }
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(3)
        .select('caseTitle citation courtName summary keywords -_id');
    } catch (textSearchError) {
      // Text index missing/unavailable — fall back to regex below.
      relevantCases = [];
    }

    if (relevantCases.length === 0) {
      const regexConditions = effectiveKeywords.flatMap((keyword) => {
        const pattern = { $regex: escapeRegex(keyword), $options: 'i' };
        return [
          { caseTitle: pattern },
          { summary: pattern },
          { facts: pattern },
          { legalLaws: pattern },
        ];
      });
      if (regexConditions.length > 0) {
        relevantCases = await LegalCase.find({ $or: regexConditions })
          .limit(3)
          .select('caseTitle citation courtName summary keywords -_id');
      }
    }

    console.log('Found Cases:', relevantCases.length);

    if (relevantCases.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          question: message,
          answer: CASE_NOT_FOUND_NOTE,
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
      `You are a legal AI assistant. You MUST answer the user's question using ONLY the provided Context below. Do NOT use your general knowledge or any external case law. Only cite the cases provided in the context. If none are provided, do not cite any cases. If the answer is not in the context, say exactly: '${CASE_NOT_FOUND_NOTE}'`,
      contextString,
      { userPrompt: message, temperature: 0.2, maxTokens: 1000 }
    );

    // Consistency guarantee: if the AI explicitly says "no relevant cases",
    // never attach cited cases to that message — the UI must show both or neither.
    const refused = answer.toLowerCase().includes('could not find any relevant cases');
    return res.status(200).json({
      success: true,
      data: {
        question: message,
        answer,
        citedCases: refused ? [] : citedCases,
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

    // Cap each field so the total prompt stays well under Groq's free-tier
    // tokens-per-minute limit (8000 TPM) with real Atlas case documents.
    const cap = (value, max) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
    const context = [
      `Title: ${cap(legalCase.caseTitle, 200)}`,
      `Summary: ${cap(legalCase.summary, 2000) || 'Not available'}`,
      `Facts: ${cap(legalCase.facts, 4000) || 'Not available'}`,
      `Legal Laws: ${cap((laws || []).join(', '), 1500) || 'Not available'}`,
      `Full Text (excerpt): ${cap(legalCase.fullText, 12000) || 'Not available'}`,
      `Verdict: ${cap(legalCase.verdict, 1500)}`,
    ].join('\n');

    const answer = await generateAIResponse(
      'You are a Pakistani legal assistant for this specific case. Answer based ONLY on the provided context. If you don\'t know, say so — do not use general knowledge, external case databases, or information from other cases.',
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

// ─── Explain Law (Legal Research module) ─────────────────────────────────────
// Frontend sends { text, instruction }; we hand the raw section text or the
// judgment excerpt to Groq with a lawyer-friendly default instruction and
// return the plain-language explanation / summary.
const explainLaw = async (req, res) => {
  try {
    const text = String(req.body?.text ?? '').trim();
    const instruction = String(req.body?.instruction ?? '').trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'The section or judgment text is required.',
      });
    }
    if (text.length > 20000) {
      return res.status(400).json({
        success: false,
        message: 'The provided text is too long. Limit it to 20000 characters.',
      });
    }

    const systemPrompt =
      instruction ||
      'You are a strict legal explainer. I will provide you with a text. Explain or summarize it using ONLY the provided text. Do NOT use your outside knowledge. Do not add extra sections, laws, or details that are not present in the text below. If the text is short, your explanation must also be short.';
    const cappedText = text.replace(/\s+/g, ' ').trim().slice(0, 12000);

    console.log('Explain Law request — text length:', cappedText.length, '| custom instruction:', Boolean(instruction));
    console.log('Explain text sent to AI:', cappedText);

    const answer = await generateAIResponse(
      systemPrompt,
      cappedText,
      { temperature: 0.2, maxTokens: 1500 }
    );

    return res.status(200).json({ success: true, data: { answer } });
  } catch (error) {
    console.error('Explain law error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: error?.message || 'Unable to explain the provided legal text.',
    });
  }
};

// ─── AI fallback for the Legal Dictionary ────────────────────────────────────
// Called only when a term is missing from the local MongoDB dictionary.
// Returns a structured Pakistani-law definition so the frontend can render the
// same fields as a seeded term.
const defineTerm = async (req, res) => {
  try {
    const rawTerm = String(req.body?.term ?? req.body?.query ?? '').trim();

    if (!rawTerm) {
      return res.status(400).json({
        success: false,
        message: 'A legal term is required.',
      });
    }

    if (rawTerm.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'The term is too long. Please limit it to 120 characters.',
      });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error('AI Define Term Error: GROQ_API_KEY is missing on the server.');
      return res.status(503).json({
        success: false,
        message:
          'The AI service is not configured on the server (GROQ_API_KEY missing). Please contact the administrator or try again later.',
      });
    }

    console.log('AI Define Term request for:', rawTerm);

    const prompt =
      `You are a senior Pakistani lawyer. Define the legal term '${rawTerm}' strictly according to Pakistani Law (PPC, CrPC, Constitution of Pakistan). ` +
      'Provide the English definition, Urdu explanation, and a practical example relevant to Pakistani courts. ' +
      'If applicable, mention the exact section or act (e.g., Section 302 PPC). ' +
      'Respond with valid JSON only, using exactly these keys: ' +
      '{"englishDefinition": "...", "urduExplanation": "...", "example": "..."}. ' +
      'Do not wrap the JSON in markdown fences and do not add any other text.';

    const rawAnswer = await generateAIResponse(prompt, '', {
      provider: 'groq',
      userPrompt: `Define "${rawTerm}" under Pakistani law.`,
      temperature: 0.2,
      // Reasoning models spend tokens on thinking before writing the answer —
      // 1200 could starve the actual definition and yield an empty completion.
      maxTokens: 3000,
    });

    // Models sometimes wrap JSON in ```json fences or add a short preamble.
    // Extract the first {...} block before parsing.
    const cleaned = String(rawAnswer)
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    const jsonText = start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned;

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      // Last-resort fallback: keep the model text as the English definition.
      parsed = { englishDefinition: cleaned, urduExplanation: '', example: '' };
    }

    const englishDefinition = String(parsed.englishDefinition || parsed.definition || '').trim();
    const urduExplanation = String(parsed.urduExplanation || parsed.urdu || '').trim();
    const example = String(parsed.example || '').trim();

    if (!englishDefinition) {
      return res.status(502).json({
        success: false,
        message: 'The AI did not return a usable definition. Please try again.',
      });
    }

    return res.status(200).json({
      success: true,
      source: 'ai',
      data: {
        term: rawTerm,
        englishDefinition,
        urduExplanation,
        example,
        category: 'General',
        relatedTerms: [],
        aiGenerated: true,
      },
    });
  } catch (error) {
    console.error('AI Define Term Error:', error);
    const message =
      error?.message || 'Unable to generate a definition right now. Please try again later.';

    const status = /401|api key|unauthorized|invalid/i.test(message) ? 503 : 500;
    const friendly = status === 503
      ? 'The AI service is currently busy or misconfigured. Please try again later.'
      : message;

    return res.status(status).json({
      success: false,
      message: friendly,
    });
  }
};

// ─── Summarize Judgment / Extract Principles (Case Laws module) ─────────────
// Both take the raw judgment text and respond strictly from it — the same
// anti-hallucination contract as explain-law.
const LIMIT_THAT_NOTE = 'The judgment text is required.';

const SUMMARIZE_SYSTEM_PROMPT =
  'You are a strict legal summarizer. Use ONLY the provided judgment text. Do not hallucinate. Do not invent facts, sections, laws, or citations that are not present in the text below. Summarize the judgment in this structure: Overview, Key Facts, Legal Issues, Court\'s Decision & Reasoning. If the text is short, your summary must also be short.';

const PRINCIPLES_SYSTEM_PROMPT =
  'You are a strict legal analyst. Use ONLY the provided judgment text. Do not hallucinate. Do not invent facts, sections, laws, or citations that are not present in the text below. Extract the judgment\'s legal principles as bullet points under these headings: Key Facts, Legal Issues, Arguments Both Sides (only if present), Court Decision, Precedent Value. If the text is short, keep it brief.';

const runStrictJudgmentTool = async (req, res, systemPrompt) => {
  try {
    const text = String(req.body?.text ?? '').trim();
    const instruction = String(req.body?.instruction ?? '').trim();

    if (!text) {
      return res.status(400).json({ success: false, message: LIMIT_THAT_NOTE });
    }
    if (text.length > 40000) {
      return res.status(400).json({ success: false, message: 'The judgment text is too long. Limit it to 40000 characters.' });
    }

    const cappedText = text.replace(/\s+/g, ' ').trim().slice(0, 12000);
    console.log('Judgment AI tool — text length:', cappedText.length, '| tool:', systemPrompt.slice(10, 40));

    const answer = await generateAIResponse(systemPrompt, cappedText, { temperature: 0.2, maxTokens: 1500 });
    return res.status(200).json({ success: true, data: { answer } });
  } catch (error) {
    console.error('Judgment AI tool error:', error?.message || String(error));
    return res.status(500).json({ success: false, message: error?.message || 'Unable to process the judgment text.' });
  }
};

const summarizeJudgment = async (req, res) => runStrictJudgmentTool(req, res, SUMMARIZE_SYSTEM_PROMPT);
const extractPrinciples = async (req, res) => runStrictJudgmentTool(req, res, PRINCIPLES_SYSTEM_PROMPT);

module.exports = { chatWithAI, caseSpecificChat, simpleCaseChat, explainLaw, summarizeJudgment, extractPrinciples, defineTerm };
