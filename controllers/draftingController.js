const mongoose = require('mongoose');
const Draft = require('../models/Draft');
const { DOCUMENT_TYPES } = Draft;
const { generateAIResponse } = require('../services/aiService');

const MAX_INSTRUCTIONS_LENGTH = 8000;
const MAX_DRAFT_LENGTH = 30000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clean = (value) => String(value ?? '').trim();

const getUserId = (req) => req.user?._id || req.user?.id;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

/**
 * Prefer Groq for drafting (as required by the SRS) whenever a key exists.
 * `DRAFTING_AI_PROVIDER` can override this, and the global AI_PROVIDER is used
 * as the final fallback so the module still works with Gemini/KIE setups.
 */
const getDraftingOptions = (maxTokens) => {
  const options = { temperature: 0.2, maxTokens };
  const preferred = clean(process.env.DRAFTING_AI_PROVIDER).toLowerCase();

  if (preferred) {
    options.provider = preferred;
  } else if (process.env.GROQ_API_KEY) {
    options.provider = 'groq';
  } else if (process.env.GEMINI_API_KEY) {
    options.provider = 'gemini';
  } else if (process.env.KIE_API_KEY) {
    options.provider = 'kie';
  }

  return options;
};

const buildGeneratePrompt = (documentType, instructions) => `You are a senior Pakistani lawyer. Generate a formal legal draft for a ${documentType} based on these instructions: ${instructions}. Format it professionally with 'IN THE COURT OF...', 'Subject:', and formal legal paragraphs. Do not invent facts. Keep placeholders like [Client Name] where specific info is missing.

Additional Pakistani drafting rules:
- Use formal Pakistani legal conventions and terminology (e.g. "MOST RESPECTFULLY SHOWETH", "It is respectfully prayed that", "PRAYER", "VERIFICATION", "DEPONENT").
- For documents that are not filed in court (Legal Notice, Basic Agreement), use an appropriate formal heading such as "LEGAL NOTICE" or "AGREEMENT" instead of "IN THE COURT OF...".
- Include a "Subject:" line, numbered paragraphs, and a prayer/relief clause where applicable.
- Include dated signature blocks with bracketed placeholders (e.g. [Advocate Name], [Client Name], [Date]).
- Never invent names, dates, amounts, statutory sections, or facts. Use bracketed placeholders such as [Client Name], [Opposite Party], [Court], [Date], [Amount], [Section] whenever the information is missing.
- Return ONLY the finished draft text. Do not include explanations, commentary, markdown code fences, or notes.`;

const buildEditPrompt = (instruction) => `You are a legal editor. Modify the following text according to this instruction: ${instruction}.

Rules:
- You MUST actually rewrite the text. Do NOT return the original text unchanged. Rephrase sentences and restructure paragraphs so the output is visibly different from the input.
- Return ONLY the updated legal text, without any conversational filler like 'Here is the updated text'.
- Preserve every fact, name, date, amount, statutory reference, and bracketed placeholder from the original draft. Do not invent new facts.
- Preserve the professional Pakistani legal format, headings, numbered paragraphs, prayer/relief clause, and signature blocks.
- Keep the legal meaning intact.
- Return ONLY the revised draft text. Do not include explanations, commentary, markdown code fences, or notes.`;

// ─── POST /api/drafting/generate ─────────────────────────────────────────────
// @desc   Generate a new legal draft with AI and save it
// @access Private (JWT)
const generateDraft = async (req, res) => {
  try {
    const documentType = clean(req.body?.documentType);
    const instructions = clean(req.body?.instructions);

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Please select a document type.',
      });
    }

    if (!DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported document type. Choose one of: ${DOCUMENT_TYPES.join(', ')}.`,
      });
    }

    if (!instructions) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the case details or drafting instructions.',
      });
    }

    if (instructions.length > MAX_INSTRUCTIONS_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Instructions are too long. Please limit them to ${MAX_INSTRUCTIONS_LENGTH} characters.`,
      });
    }

    const systemPrompt = buildGeneratePrompt(documentType, instructions);

    const generatedContent = await generateAIResponse(
      systemPrompt,
      '',
      {
        userPrompt: `Generate the ${documentType} now, strictly following the instructions and drafting rules.`,
        ...getDraftingOptions(4000),
      }
    );

    const draft = await Draft.create({
      userId: getUserId(req),
      documentType,
      instructions,
      generatedContent,
    });

    return res.status(201).json({
      success: true,
      message: 'Draft generated successfully.',
      data: draft,
    });
  } catch (error) {
    console.error('Draft generation error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Unable to generate the draft. Please check the AI configuration and try again.',
    });
  }
};

// ─── POST /api/drafting/edit ─────────────────────────────────────────────────
// @desc   Rewrite an existing draft ("Make it more formal", "Simplify the English")
// @access Private (JWT)
const editDraft = async (req, res) => {
  try {
    const text = clean(req.body?.text);
    const instruction = clean(req.body?.instruction);
    const draftId = clean(req.body?.draftId);
    const documentType = clean(req.body?.documentType);

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'There is no draft text to edit. Generate a draft first.',
      });
    }

    if (!instruction) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an editing instruction.',
      });
    }

    if (text.length > MAX_DRAFT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `The draft is too long to edit. Please limit it to ${MAX_DRAFT_LENGTH} characters.`,
      });
    }

    // Verify ownership before spending an AI call.
    let draft = null;

    if (draftId) {
      if (!isValidId(draftId)) {
        return res.status(404).json({
          success: false,
          message: 'The draft could not be found.',
        });
      }

      draft = await Draft.findOne({ _id: draftId, userId: getUserId(req) });

      if (!draft) {
        return res.status(404).json({
          success: false,
          message: 'The draft could not be found.',
        });
      }
    }

    console.log(
      `Draft edit request — instruction: "${instruction}" | text length: ${text.length}`
    );
    console.log('Draft text sent to AI:', text);

    const revisedContent = await generateAIResponse(
      buildEditPrompt(instruction),
      text,
      {
        userPrompt: `Modify the draft according to this instruction: ${instruction}. Return only the updated legal text.`,
        ...getDraftingOptions(8000),
        // Rewriting needs some latitude — 0.2 makes the model echo the input.
        temperature: 0.4,
      }
    );

    if (!String(revisedContent || '').trim()) {
      return res.status(502).json({
        success: false,
        message: 'The AI did not return a revised draft. Please try again.',
      });
    }

    if (draft) {
      draft.editHistory.push({
        instruction,
        content: draft.generatedContent,
        editedAt: new Date(),
      });
      draft.generatedContent = revisedContent;
      await draft.save();
    } else {
      // The user pasted text without generating first — still persist the result.
      const safeDocumentType = DOCUMENT_TYPES.includes(documentType)
        ? documentType
        : DOCUMENT_TYPES[0];

      draft = await Draft.create({
        userId: getUserId(req),
        documentType: safeDocumentType,
        instructions: clean(req.body?.instructions) || instruction,
        generatedContent: revisedContent,
        editHistory: [{ instruction, content: text, editedAt: new Date() }],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Draft updated successfully.',
      content: draft.generatedContent,
      data: draft,
    });
  } catch (error) {
    console.error('Draft edit error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Unable to edit the draft. Please check the AI configuration and try again.',
    });
  }
};

// ─── GET /api/drafting ───────────────────────────────────────────────────────
// @desc   List the signed-in user's saved drafts (newest first)
// @access Private (JWT)
const getDrafts = async (req, res) => {
  try {
    const drafts = await Draft.find({ userId: getUserId(req) })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('-editHistory');

    return res.status(200).json({
      success: true,
      count: drafts.length,
      data: drafts,
    });
  } catch (error) {
    console.error('List drafts error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: 'Unable to load saved drafts.',
    });
  }
};

// ─── GET /api/drafting/:id ───────────────────────────────────────────────────
// @desc   Load one saved draft
// @access Private (JWT)
const getDraftById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found.',
      });
    }

    const draft = await Draft.findOne({
      _id: req.params.id,
      userId: getUserId(req),
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found.',
      });
    }

    return res.status(200).json({ success: true, data: draft });
  } catch (error) {
    console.error('Get draft error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: 'Unable to load the draft.',
    });
  }
};

// ─── PUT /api/drafting/:id ───────────────────────────────────────────────────
// @desc   Persist manual edits made in the editor
// @access Private (JWT)
const saveDraft = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found.',
      });
    }

    const generatedContent = String(req.body?.generatedContent ?? '');

    if (!generatedContent.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Draft content cannot be empty.',
      });
    }

    if (generatedContent.length > MAX_DRAFT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `The draft is too long. Please limit it to ${MAX_DRAFT_LENGTH} characters.`,
      });
    }

    const draft = await Draft.findOne({
      _id: req.params.id,
      userId: getUserId(req),
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found.',
      });
    }

    draft.generatedContent = generatedContent;
    await draft.save();

    return res.status(200).json({
      success: true,
      message: 'Draft saved.',
      data: draft,
    });
  } catch (error) {
    console.error('Save draft error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: 'Unable to save the draft.',
    });
  }
};

// ─── DELETE /api/drafting/:id ────────────────────────────────────────────────
// @desc   Delete a saved draft
// @access Private (JWT)
const deleteDraft = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found.',
      });
    }

    const draft = await Draft.findOneAndDelete({
      _id: req.params.id,
      userId: getUserId(req),
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Draft deleted.',
      data: { _id: draft._id },
    });
  } catch (error) {
    console.error('Delete draft error:', error?.message || String(error));
    return res.status(500).json({
      success: false,
      message: 'Unable to delete the draft.',
    });
  }
};

module.exports = {
  generateDraft,
  editDraft,
  getDrafts,
  getDraftById,
  saveDraft,
  deleteDraft,
};
