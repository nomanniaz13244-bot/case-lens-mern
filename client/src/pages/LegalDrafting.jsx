import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  FileText,
  Download,
  Wand2,
  Loader2,
  Sparkles,
  FilePenLine,
  ClipboardCopy,
  Check,
  History,
  ChevronDown,
  AlertCircle,
  Type,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const getAuthToken = () =>
  localStorage.getItem('case_lens_token') || localStorage.getItem('token');

const DOCUMENT_TYPES = [
  'Legal Notice',
  'Civil Petition',
  'Constitutional Petition',
  'Court Application',
  'Basic Agreement',
];

export default function LegalDrafting() {
  // ── Form state ──
  const [documentType, setDocumentType] = useState('');
  const [instructions, setInstructions] = useState('');

  // ── Draft state ──
  const [draftContent, setDraftContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [draftId, setDraftId] = useState(null);

  // ── Saved drafts ──
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  const textareaRef = useRef(null);

  // ── Generate Draft ──
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!documentType || !instructions.trim()) return;
    setGenerating(true);
    setError('');
    setDraftContent('');
    setDraftId(null);
    try {
      const token = getAuthToken();
      const res = await axios.post(
        `${API_BASE}/drafting/generate`,
        { documentType, instructions: instructions.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 120000,
        }
      );
      setDraftContent(res.data?.data?.generatedContent || '');
      setDraftId(res.data?.data?.draftId || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to generate draft. Make sure the backend is running.'
      );
    } finally {
      setGenerating(false);
    }
  };

  // ── AI Edit (Improve / Simplify / Custom) ──
  const handleAIEdit = async (instruction) => {
    if (!draftContent.trim() || editing) return;
    setEditing(true);
    setError('');
    try {
      const token = getAuthToken();
      const res = await axios.post(
        `${API_BASE}/drafting/edit`,
        { text: draftContent, instruction },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 120000,
        }
      );
      setDraftContent(res.data?.data?.editedContent || draftContent);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to edit draft with AI.'
      );
    } finally {
      setEditing(false);
    }
  };

  // ── Copy to clipboard ──
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = draftContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Download as PDF (window.print) ──
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${documentType || 'Legal Draft'} - Case Lens</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13pt;
            line-height: 1.8;
            margin: 1in;
            color: #000;
          }
          h1, h2, h3 { font-family: 'Times New Roman', Times, serif; }
          pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.8; }
          @media print {
            body { margin: 0.75in; }
          }
        </style>
      </head>
      <body>
        <pre>${draftContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  // ── Download as Word (.doc) ──
  const handleDownloadWord = () => {
    const header =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>Legal Draft</title>' +
      '<style>body{font-family:"Times New Roman",Times,serif;font-size:13pt;line-height:1.8;margin:1in;}pre{white-space:pre-wrap;word-wrap:break-word;font-family:"Times New Roman",Times,serif;font-size:13pt;line-height:1.8;}</style></head><body>';
    const footer = '</body></html>';
    const content = `<pre>${draftContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    const blob = new Blob([header + content + footer], {
      type: 'application/msword',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(documentType || 'Legal_Draft').replace(/\s+/g, '_')}_${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Load saved drafts ──
  const handleLoadDrafts = async () => {
    if (showDrafts) {
      setShowDrafts(false);
      return;
    }
    setLoadingDrafts(true);
    try {
      const token = getAuthToken();
      const res = await axios.get(`${API_BASE}/drafting/my-drafts`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 15000,
      });
      setSavedDrafts(res.data?.data || []);
      setShowDrafts(true);
    } catch {
      setError('Failed to load saved drafts.');
    } finally {
      setLoadingDrafts(false);
    }
  };

  const loadDraft = (draft) => {
    setDocumentType(draft.documentType || '');
    setInstructions(draft.instructions || '');
    setDraftContent(draft.generatedContent || '');
    setDraftId(draft._id || null);
    setShowDrafts(false);
  };

  const hasDraft = draftContent.trim().length > 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F5F5]">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* ── Page Header ── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <FilePenLine size={26} strokeWidth={1.8} />
              Legal Drafting
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              AI-powered legal document drafting for Pakistani courts
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadDrafts}
            disabled={loadingDrafts}
            className="flex items-center gap-2 self-start rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:shadow"
          >
            {loadingDrafts ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <History size={16} />
            )}
            My Saved Drafts
            <ChevronDown
              size={14}
              className={`transition ${showDrafts ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* ── Saved Drafts Dropdown ── */}
        {showDrafts && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Saved Drafts
            </p>
            {savedDrafts.length === 0 ? (
              <p className="text-sm text-gray-400">
                No saved drafts yet. Generate your first one below.
              </p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {savedDrafts.map((draft) => (
                  <button
                    key={draft._id}
                    type="button"
                    onClick={() => loadDraft(draft)}
                    className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-[#FAFAFA] px-4 py-3 text-left transition hover:border-gray-400 hover:shadow-sm"
                  >
                    <FileText size={16} className="flex-shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {draft.documentType}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {draft.instructions?.slice(0, 80)}
                        {draft.instructions?.length > 80 ? '…' : ''}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[10px] text-gray-400">
                      {new Date(draft.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
            <button
              type="button"
              onClick={() => setError('')}
              className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Main 2-Column Layout ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ─── LEFT SIDEBAR: Input Form ─── */}
          <div className="lg:col-span-4 xl:col-span-3">
            <form
              onSubmit={handleGenerate}
              className="sticky top-6 space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Draft Configuration
              </p>

              {/* Document Type */}
              <div>
                <label
                  htmlFor="docType"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Document Type
                </label>
                <div className="relative">
                  <select
                    id="docType"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-300 bg-[#FAFAFA] px-4 py-3 pr-10 text-sm text-gray-800 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                    required
                  >
                    <option value="" disabled>
                      Select document type…
                    </option>
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label
                  htmlFor="instructions"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Case Details / Instructions
                </label>
                <textarea
                  id="instructions"
                  rows={8}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Describe the facts, parties involved, dates, legal issues, and what you want the document to convey…"
                  className="w-full resize-none rounded-xl border border-gray-300 bg-[#FAFAFA] px-4 py-3 text-sm leading-relaxed text-gray-800 placeholder-gray-400 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                  required
                />
                <p className="mt-1 text-right text-[10px] text-gray-400">
                  {instructions.length.toLocaleString()} / 10,000
                </p>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={generating || !documentType || !instructions.trim()}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition ${
                  generating || !documentType || !instructions.trim()
                    ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                    : 'bg-black text-white shadow-sm hover:bg-gray-800'
                }`}
              >
                {generating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                {generating ? 'Generating Draft…' : 'Generate Draft'}
              </button>
            </form>
          </div>

          {/* ─── RIGHT MAIN: Draft Editor ─── */}
          <div className="lg:col-span-8 xl:col-span-9">
            {/* Action Buttons Bar */}
            {hasDraft && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAIEdit(
                      'Improve this draft: make the language more formal, authoritative, and legally precise. Strengthen the legal arguments and ensure proper legal terminology is used throughout.'
                    )
                  }
                  disabled={editing}
                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:shadow"
                >
                  {editing ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Wand2 size={15} />
                  )}
                  Improve with AI
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAIEdit(
                      'Simplify the English in this legal draft. Use clearer, simpler language while maintaining the legal validity and formal structure. Make it easier to understand for non-lawyers.'
                    )
                  }
                  disabled={editing}
                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:shadow"
                >
                  {editing ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Type size={15} />
                  )}
                  Simplify with AI
                </button>

                <div className="hidden sm:block sm:flex-1" />

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:shadow"
                >
                  {copied ? (
                    <Check size={15} className="text-green-600" />
                  ) : (
                    <ClipboardCopy size={15} />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:shadow"
                >
                  <Download size={15} />
                  PDF
                </button>
                <button
                  type="button"
                  onClick={handleDownloadWord}
                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:shadow"
                >
                  <FileText size={15} />
                  Word
                </button>
              </div>
            )}

            {/* Draft Editor Area */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              {hasDraft ? (
                <div className="relative">
                  {/* Editing overlay */}
                  {editing && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-[2px]">
                      <div className="flex items-center gap-3 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg">
                        <Loader2 size={18} className="animate-spin" />
                        AI is rewriting your draft…
                      </div>
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="min-h-[600px] w-full resize-y rounded-2xl border-none bg-transparent px-8 py-8 font-mono text-sm leading-7 text-gray-800 outline-none"
                    style={{ tabSize: 4 }}
                  />
                </div>
              ) : (
                <div className="flex min-h-[500px] flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F5F5]">
                    <FilePenLine size={28} strokeWidth={1.5} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {generating ? 'Generating your draft…' : 'No Draft Yet'}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-gray-400">
                    {generating
                      ? 'Our AI lawyer is drafting your document. This may take a moment.'
                      : 'Select a document type, provide your case details, and click "Generate Draft" to begin.'}
                  </p>
                  {generating && (
                    <Loader2
                      size={28}
                      className="mt-6 animate-spin text-gray-400"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Word count */}
            {hasDraft && (
              <p className="mt-3 text-right text-[11px] text-gray-400">
                {draftContent.split(/\s+/).filter(Boolean).length.toLocaleString()} words
                &nbsp;·&nbsp;
                {draftContent.length.toLocaleString()} characters
                {draftId && (
                  <span>
                    &nbsp;·&nbsp;
                    <span className="text-green-600">Saved to database</span>
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
