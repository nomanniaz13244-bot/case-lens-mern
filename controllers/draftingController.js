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

// Per-document-type scaffolds. The model must CONVERT the user's raw story
// into the formal structure of the selected document — never repeat it.
const DOCUMENT_SCAFFOLDS = {
  'Legal Notice': `- Start with the heading 'LEGAL NOTICE UNDER SECTION 80 CPC' on its own line.
- Add 'To,' followed by '[Opposite Party Name]' and '[Opposite Party Address]'.
- Write a 'SUBJECT:' line summarising the grievance in one formal sentence.
- Under the 'FACTS' heading, translate the user's story into formal legal English (use terms like 'herein', 'whereas', 'my client', 'breach of contract', 'illegal and malafide conduct'). Do NOT repeat the raw story as informal speech.
- Add a 'LEGAL GROUNDS' section citing the relevant Acts/Sections that apply (e.g., Contract Act 1872; if the facts suggest refund/damages, cite the appropriate sections; do not invent sections that do not exist).
- End with a strict 15-day demand stating exactly what the client requires within that period, followed by a warning that failing to comply the client will initiate appropriate legal proceedings, civil and/or criminal, at the addressee's risk, cost and consequences.
- Close with 'Yours faithfully,' and a dated signature block for [Advocate Name], [Advocate High Court], on behalf of [Client Name].`,
  'Civil Petition': `- Start with 'IN THE COURT OF [Name of Court]' on its own line, followed by the jurisdiction line.
- Add the 'PETITION NO. [___] OF [Year]' and the styled parties line: '[Client Name] ... Petitioner VERSUS [Opposite Party] ... Respondents'.
- Write a 'RESPECTFULLY SHEWETH:' section converting the user's story into numbered formal paragraphs (use 'body'/facts language like 'herein', 'whereas', 'the petitioner submits').
- Add a 'GROUNDS' section citing the relevant Acts/Sections (do not invent sections).
- End with 'PRAYER:' asking the court for the specific relief strictly derived from the user's story, then 'Humbly prayed that...'.
- Close with a verification block and dated signature block for [Advocate Name] / [Client Name].`,
  'Constitutional Petition': `- Start with 'IN THE ISLAMABAD HIGH COURT / [Name of Court]' on its own line.
- Add the styled line: '[Client Name] ... Petitioner VERSUS Federation of Pakistan / [Authority] ... Respondents' and 'CONSTITUTIONAL PETITION No. [___] OF [Year]' under Article 199 of the Constitution of the Islamic Republic of Pakistan, 1973 (or Article 184(3) where the facts involve a matter of public importance).
- Convert the user's story into numbered formal paragraphs describing the impugned action, the legal right violated, and the arbitrariness/ultra vires character of the action.
- Cite the relevant constitutional Articles (e.g., Articles 4, 10-A, 14, 24) ONLY where genuinely supported by the facts supplied.
- End with 'PRAYER:' listing the declarations and directions sought.
- Close with a dated signature block for [Advocate Name].`,
  'Court Application': `- Start with 'IN THE COURT OF [Name of Court]' on its own line, followed by the case style: '[Client Name] ... Applicant VERSUS [Opposite Party] ... Respondents' and the application title (e.g., 'APPLICATION UNDER SECTION [___] OF [Act]').
- Convert the user's story into numbered formal paragraphs (use 'it is submitted that', 'whereas').
- Cite the relevant Act/Section the application is brought under — always use a [Section] placeholder unless the facts make the section unambiguous.
- End with 'PRAYER:' and 'It is therefore most respectfully prayed that this Hon'ble Court may graciously be pleased to...' stating the specific relief.
- Close with 'Humbly submitted.' and a dated signature block for [Advocate Name] / [Client Name].`,
  'Basic Agreement': `- Start with the heading 'AGREEMENT' on its own line, followed by 'This Agreement is made on this [___] day of [Month], [Year] at [City]'.
- Add the parties recital: 'BETWEEN [Client Name], s/o [___], resident of [___] (hereinafter referred to as the "First Party") AND [Opposite Party Name] (hereinafter referred to as the "Second Party")'.
- Add a 'WHEREAS' recital section converting the user's story into formal recitals.
- Number the operative clauses (1, 2, 3...) covering consideration, performance obligations, timelines, and payment terms strictly derived from the user's story.
- Add standard formal clauses: governing law ('Laws of the Islamic Republic of Pakistan'), dispute resolution, Force Majeure, and signatures.
- Close with signature blocks for both parties plus two [Witness Name] witnesses.`,
};

const buildGeneratePrompt = (documentType, instructions) => `You are a senior Pakistani Advocate. The user will provide raw facts or instructions. You must DRAFT a formal ${documentType}.

CRITICAL RULE — CONVERT, DO NOT REPEAT:
- The user's story is raw input, never part of the final document. Rephrase it into formal legal English with proper pleading language.
- Do NOT copy the user's sentences, quotations, tone, or phrasing into the draft. Transform them: first-person client narration becomes third-person pleading language ('my client' becomes 'the complainant'/'the petitioner', 'he didn't deliver the goods' becomes 'the respondent failed, neglected and refused to deliver the contracted goods').

Structure — follow the document scaffold exactly:
${DOCUMENT_SCAFFOLDS[documentType] || DOCUMENT_SCAFFOLDS['Legal Notice']}

Universally applicable Pakistani drafting rules:
- Use formal Pakistani legal conventions ("MOST RESPECTFULLY SHOWETH", "It is respectfully prayed that", "PRAYER", "VERIFICATION", "Yours faithfully").
- Every case-specific fact must remain exactly as given by the user — never invent names, dates, amounts, statutory sections or facts. Use bracketed placeholders such as [Client Name], [Opposite Party], [Court], [Date], [Amount], [Section] whenever information is missing, keeping the user's given facts in place of the relevant placeholders.
- Formatting: output clean plain-text paragraphs with proper spacing. Blank line between every block. Headings (SUBJECT, FACTS, LEGAL GROUNDS, PRAYER, VERIFICATION) in UPPERCASE on their own line. Numbered clauses as '1.', '2.', '3.'. Keep sentences inside paragraphs on connected lines, never one-clause-per-line.
- Do NOT use markdown syntax: no '#', '##', no **bold**, no bullet characters '*', '-', no code fences.
- Return ONLY the finished draft text. Do not include explanations, commentary, or notes.`;

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

    console.log(
      `Draft generate request — type: "${documentType}" | instructions length: ${instructions.length}`
    );
    console.log('Raw instructions sent to AI:', instructions);

    const generatedContent = await generateAIResponse(
      systemPrompt,
      instructions,
      {
        userPrompt: `RAW FACTS FROM THE CLIENT:\n${instructions}\n\nDraft the formal ${documentType} now. Convert the raw facts above into the full professional format: do not repeat the client's words.`,
        ...getDraftingOptions(8000),
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
