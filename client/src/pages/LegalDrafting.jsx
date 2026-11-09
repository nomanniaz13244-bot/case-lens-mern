import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FilePenLine,
  FileText,
  History,
  Loader2,
  Printer,
  Save,
  Scale,
  Sparkles,
  Wand2,
} from 'lucide-react';

const DOCUMENT_TYPES = [
  'Legal Notice',
  'Civil Petition',
  'Constitutional Petition',
  'Court Application',
  'Basic Agreement',
];

const MAX_INSTRUCTIONS_LENGTH = 8000;
const MAX_DRAFT_LENGTH = 30000;

const AI_INSTRUCTIONS = {
  improve:
    'Make this draft more formal, precise, and persuasive in the style of a senior Pakistani advocate. Strengthen the legal language and structure without changing any facts, names, dates, amounts, statutory references, or bracketed placeholders.',
  simplify:
    'Simplify the English of this draft into clear, plain legal English that a lay client can understand, while preserving every fact, legal right, statutory reference, bracketed placeholder, and the overall Pakistani legal format.',
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const slugify = (value) =>
  String(value || 'legal-draft')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'legal-draft';

const todayStamp = () => new Date().toISOString().slice(0, 10);

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const countWords = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};

const triggerFileDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
};

const buildPrintDocument = (title, content) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { size: A4; margin: 1in; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #111111;
        background: #ffffff;
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
        line-height: 1.65;
      }
      .draft {
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    </style>
  </head>
  <body>
    <div class="draft">${escapeHtml(content)}</div>
  </body>
</html>`;

const buildWordDocument = (title, content) => `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page { size: A4; margin: 1in; }
      body {
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
        line-height: 1.65;
        color: #111111;
      }
      p { margin: 0 0 8pt 0; }
    </style>
  </head>
  <body>
    <div>${escapeHtml(content).replace(/\r?\n/g, '<br />')}</div>
  </body>
</html>`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LegalDrafting() {
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [instructions, setInstructions] = useState('');
  const [content, setContent] = useState('');
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [draftId, setDraftId] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [editAction, setEditAction] = useState('');
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  const [drafts, setDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  const isDirty = Boolean(content) && content !== lastSavedContent;
  const busy = generating || Boolean(editAction) || saving;

  const fetchDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      const response = await axios.get('/api/drafting', { timeout: 20000 });
      setDrafts(response.data?.data || []);
    } catch (requestError) {
      // Do not shout on the initial background load; the form still works.
      if (requestError.response?.status !== 401) {
        setError(requestError.response?.data?.message || 'Unable to load saved drafts.');
      }
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const resetMessages = () => {
    setError('');
    setNotice('');
    setCopied(false);
  };

  const handleGenerate = async () => {
    const trimmedInstructions = instructions.trim();

    if (!trimmedInstructions) {
      setNotice('');
      setError('Please describe the case facts or drafting instructions first.');
      return;
    }

    resetMessages();
    setGenerating(true);

    try {
      const response = await axios.post(
        '/api/drafting/generate',
        { documentType, instructions: trimmedInstructions },
        { timeout: 120000 }
      );

      const draft = response.data?.data;
      const generatedContent =
        draft?.generatedContent || response.data?.generatedContent || '';

      if (!String(generatedContent).trim()) {
        throw new Error('The AI service returned an empty draft. Please try again.');
      }

      setContent(generatedContent);
      setLastSavedContent(generatedContent);
      setDraftId(draft?._id || null);
      setNotice('Draft generated and saved to your account.');
      fetchDrafts();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to generate the draft. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleAiEdit = async (mode) => {
    if (!content.trim()) {
      setError('Generate a draft (or paste text into the editor) before using AI editing.');
      return;
    }

    resetMessages();
    setEditAction(mode);

    const currentText = content;
    console.log('Sending text to edit:', currentText);

    try {
      const response = await axios.post(
        '/api/drafting/edit',
        {
          text: currentText,
          instruction: AI_INSTRUCTIONS[mode],
          draftId,
          documentType,
          instructions: instructions.trim(),
        },
        { timeout: 120000 }
      );

      const draft = response.data?.data;
      const revisedContent =
        draft?.generatedContent ||
        response.data?.content ||
        response.data?.generatedContent ||
        '';

      if (!String(revisedContent).trim()) {
        throw new Error('The AI service returned an empty revision. Please try again.');
      }

      setContent(revisedContent);
      setLastSavedContent(revisedContent);
      setDraftId(draft?._id || draftId);
      setNotice(
        mode === 'improve'
          ? 'Draft improved and saved.'
          : 'Draft simplified and saved.'
      );
      fetchDrafts();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to edit the draft. Please try again.'
      );
    } finally {
      setEditAction('');
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError('There is nothing to save.');
      return;
    }

    if (!draftId) {
      setError('Generate a draft first so it can be saved to your account.');
      return;
    }

    resetMessages();
    setSaving(true);

    try {
      await axios.put(
        `/api/drafting/${draftId}`,
        { generatedContent: content },
        { timeout: 30000 }
      );
      setLastSavedContent(content);
      setNotice('Changes saved to your account.');
      fetchDrafts();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to save your changes.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDraft = (draft) => {
    resetMessages();
    setDocumentType(
      DOCUMENT_TYPES.includes(draft.documentType) ? draft.documentType : DOCUMENT_TYPES[0]
    );
    setInstructions(draft.instructions || '');
    setContent(draft.generatedContent || '');
    setLastSavedContent(draft.generatedContent || '');
    setDraftId(draft._id || null);
    setNotice('Saved draft loaded into the editor.');
  };

  const handleNewDraft = () => {
    resetMessages();
    setDocumentType(DOCUMENT_TYPES[0]);
    setInstructions('');
    setContent('');
    setLastSavedContent('');
    setDraftId(null);
  };

  const handleClear = () => {
    resetMessages();
    setContent('');
    setLastSavedContent('');
    setDraftId(null);
  };

  const handleCopy = async () => {
    if (!content.trim()) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not access the clipboard. Please copy the text manually.');
    }
  };

  const handleDownloadPdf = () => {
    if (!content.trim()) {
      setError('Generate a draft before downloading.');
      return;
    }

    const title = `${documentType} — ${todayStamp()}`;
    const printWindow = window.open('', '_blank', 'width=900,height=760');

    if (!printWindow) {
      setError('Your browser blocked the print window. Please allow pop-ups for this site.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintDocument(title, content));
    printWindow.document.close();
    printWindow.focus();

    // Let the browser paint the document before opening the print dialog.
    window.setTimeout(() => {
      printWindow.onafterprint = () => printWindow.close();
      printWindow.print();
    }, 250);
  };

  const handleDownloadWord = () => {
    if (!content.trim()) {
      setError('Generate a draft before downloading.');
      return;
    }

    const title = `${documentType} — ${todayStamp()}`;
    const filename = `${slugify(documentType)}-${todayStamp()}.doc`;
    const blob = new Blob(['\ufeff', buildWordDocument(title, content)], {
      type: 'application/msword;charset=utf-8',
    });

    triggerFileDownload(blob, filename);
  };

  const words = countWords(content);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F5F5] text-[#1A1A1A]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Drafting &amp; Reference
            </p>
            <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-bold sm:text-3xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                <FilePenLine size={20} strokeWidth={1.9} aria-hidden="true" />
              </span>
              Legal Drafting
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
              Generate court-ready Pakistani legal drafts, refine them with AI, and export them
              for filing or client review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
              <Sparkles size={12} aria-hidden="true" />
              AI Assisted
            </span>
            <button
              type="button"
              onClick={handleNewDraft}
              className="rounded-xl border border-[#E5E5E5] bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#F5F5F5]"
            >
              New Draft
            </button>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          {/* ── Left column: form + saved drafts ─────────────────────────── */}
          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <FileText size={16} strokeWidth={1.9} aria-hidden="true" />
                  Draft Settings
                </h2>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  Step 1
                </span>
              </div>

              <label
                htmlFor="documentType"
                className="mb-1.5 block text-xs font-semibold text-gray-700"
              >
                Document Type
              </label>
              <select
                id="documentType"
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                disabled={generating || Boolean(editAction)}
                className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] outline-none transition focus:border-black focus:ring-2 focus:ring-black/5 disabled:bg-gray-50"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <label
                htmlFor="instructions"
                className="mb-1.5 mt-4 block text-xs font-semibold text-gray-700"
              >
                Case Details / Instructions
              </label>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                rows={9}
                maxLength={MAX_INSTRUCTIONS_LENGTH}
                disabled={generating || Boolean(editAction)}
                placeholder={`Describe the facts, parties, court, relief sought and any deadlines.\n\nExample: My client [Client Name] was issued a cheque by [Opposite Party] which was dishonoured...`}
                className="min-h-[180px] w-full resize-y rounded-xl border border-[#E5E5E5] bg-white p-3.5 text-sm leading-relaxed text-[#1A1A1A] outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/5"
              />
              <div className="mt-1.5 flex items-start justify-between gap-2 text-[10px] text-gray-400">
                <span>Only state facts you can verify. Missing details become placeholders.</span>
                <span className="shrink-0 tabular-nums">
                  {instructions.length}/{MAX_INSTRUCTIONS_LENGTH}
                </span>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || Boolean(editAction) || !instructions.trim()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {generating ? (
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Wand2 size={17} aria-hidden="true" />
                )}
                {generating ? 'Generating draft...' : 'Generate Draft'}
              </button>

              <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-gray-500">
                <Sparkles size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                Drafts follow Pakistani legal format and keep [bracketed placeholders] wherever
                facts are missing.
              </p>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-3.5">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <History size={16} strokeWidth={1.9} aria-hidden="true" />
                  Saved Drafts
                </h2>
                <span className="rounded-full border border-[#E5E5E5] bg-[#F5F5F5] px-2 py-0.5 text-[10px] font-bold text-gray-600">
                  {drafts.length}
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {loadingDrafts ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-gray-500">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    Loading drafts...
                  </div>
                ) : drafts.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <FileText size={22} className="mx-auto text-gray-300" aria-hidden="true" />
                    <p className="mt-2 text-xs font-semibold text-gray-600">No saved drafts yet</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-gray-400">
                      Generated drafts are saved here automatically.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {drafts.map((draft) => {
                      const isActive = draft._id === draftId;
                      return (
                        <li key={draft._id}>
                          <button
                            type="button"
                            onClick={() => handleLoadDraft(draft)}
                            className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                              isActive
                                ? 'border-black bg-[#F5F5F5]'
                                : 'border-transparent hover:border-[#E5E5E5] hover:bg-[#F5F5F5]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-semibold text-[#1A1A1A]">
                                {draft.documentType}
                              </span>
                              <span className="shrink-0 text-[9px] font-medium uppercase tracking-wide text-gray-400">
                                {formatDate(draft.updatedAt || draft.createdAt)}
                              </span>
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-500">
                              {draft.instructions || 'No instructions saved'}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </aside>

          {/* ── Right column: editor + actions ───────────────────────────── */}
          <section className="min-w-0">
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
              <div className="border-b border-[#E5E5E5] px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="flex items-center gap-2 text-sm font-bold">
                        <Scale size={16} strokeWidth={1.9} aria-hidden="true" />
                        Generated Draft
                      </h2>
                      <span className="rounded-full border border-[#E5E5E5] bg-[#F5F5F5] px-2.5 py-0.5 text-[10px] font-semibold text-gray-600">
                        {documentType}
                      </span>
                      {draftId && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            isDirty
                              ? 'border border-amber-200 bg-amber-50 text-amber-700'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isDirty ? 'Unsaved changes' : 'Saved'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {content
                        ? `${words} ${words === 1 ? 'word' : 'words'} · ${content.length} characters`
                        : 'Your AI-generated draft will appear here. You can edit it freely.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAiEdit('improve')}
                      disabled={!content.trim() || busy}
                      title="Make the draft more formal and persuasive"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {editAction === 'improve' ? (
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Wand2 size={14} aria-hidden="true" />
                      )}
                      {editAction === 'improve' ? 'Improving...' : 'Improve with AI'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAiEdit('simplify')}
                      disabled={!content.trim() || busy}
                      title="Simplify the English while keeping the legal meaning"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {editAction === 'simplify' ? (
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Sparkles size={14} aria-hidden="true" />
                      )}
                      {editAction === 'simplify' ? 'Simplifying...' : 'Simplify with AI'}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={!content.trim()}
                      title="Open the print dialog and save as PDF"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Printer size={14} aria-hidden="true" />
                      Download as PDF
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadWord}
                      disabled={!content.trim()}
                      title="Download an editable Word document"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <Download size={14} aria-hidden="true" />
                      Download as Word
                    </button>

                    {isDirty && draftId && (
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-black bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? (
                          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Save size={14} aria-hidden="true" />
                        )}
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {(error || notice) && (
                <div className="px-4 pt-3 sm:px-5">
                  {error ? (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
                    >
                      <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  ) : (
                    <div
                      role="status"
                      className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700"
                    >
                      <Check size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span className="leading-relaxed">{notice}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 p-4 sm:p-5">
                <textarea
                  id="draft-editor"
                  value={content}
                  onChange={(event) => {
                    setContent(event.target.value);
                    if (error) setError('');
                    if (notice) setNotice('');
                  }}
                  maxLength={MAX_DRAFT_LENGTH}
                  spellCheck
                  placeholder={`The generated legal draft will appear here in editable form.\n\nSelect a document type, describe the case, then click "Generate Draft". You can also paste an existing draft here and use "Improve with AI" or "Simplify with AI".`}
                  className="h-full min-h-[520px] w-full resize-y rounded-xl border border-[#E5E5E5] bg-[#FCFCFC] p-5 font-serif text-[15px] leading-7 text-[#1A1A1A] outline-none transition placeholder:font-sans placeholder:text-sm placeholder:leading-relaxed placeholder:text-gray-400 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5 lg:min-h-[660px]"
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-[#E5E5E5] px-4 py-3 text-[11px] text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="leading-relaxed">
                  AI drafts are a starting point. Verify all facts, citations and court details
                  before filing.
                </p>
                <div className="flex shrink-0 items-center gap-3">
                  {content && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 font-semibold text-black transition hover:text-gray-600"
                    >
                      {copied ? (
                        <Check size={13} aria-hidden="true" />
                      ) : (
                        <Copy size={13} aria-hidden="true" />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                  {content && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="font-semibold text-gray-500 transition hover:text-black"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
