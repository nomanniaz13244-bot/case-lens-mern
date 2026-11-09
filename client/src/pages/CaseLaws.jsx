import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Gavel, Loader2, ScrollText, Search, Sparkles, X } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const COURTS = [
  { value: '', label: 'All Courts' },
  { value: 'SUPREME COURT', label: 'Supreme Court (SC)' },
  { value: 'HIGH COURT', label: 'High Courts (LHC / SHC / PHC / IHC)' },
];

const getAuthToken = () =>
  localStorage.getItem('case_lens_token') || localStorage.getItem('token');

async function aiTool(endpoint, text, instruction = '') {
  const token = getAuthToken();
  const response = await axios.post(
    `${API_BASE}/ai/${endpoint}`,
    { text, instruction },
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 90000,
    }
  );
  return response.data?.data?.answer || '';
}

export default function CaseLaws() {
  const [query, setQuery] = useState('');
  const [court, setCourt] = useState('');
  const [year, setYear] = useState('');
  const [citation, setCitation] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Detail side-panel state
  const [selectedCase, setSelectedCase] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [principles, setPrinciples] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [similarCases, setSimilarCases] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [switchingCase, setSwitchingCase] = useState(false);

  const handleSearch = async (event) => {
    event.preventDefault();
    setSearching(true);
    setError('');
    setSelectedCase(null);
    try {
      const response = await axios.get(`${API_BASE}/case-laws/search`, {
        params: {
          ...(query.trim() && { query: query.trim() }),
          ...(court && { court }),
          ...(year.trim() && { year: year.trim() }),
          ...(citation.trim() && { citation: citation.trim() }),
        },
        timeout: 30000,
      });
      setResults({
        judgments: response.data?.judgments || [],
        counts: response.data?.counts || { judgments: 0 },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed. Is the backend running on port 5000?');
    } finally {
      setSearching(false);
    }
  };

  const openCase = async (judgment) => {
    setSelectedCase(judgment);
    setAiSummary('');
    setPrinciples('');
    setSimilarCases([]);
    // Only fetch related precedents when the record actually has an id.
    if (!judgment?._id) {
      setSimilarCases([]);
      return;
    }
    setSimilarLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/case-laws/similar/${judgment._id}`, { timeout: 30000 });
      setSimilarCases(response.data?.similarCases || []);
    } catch (err) {
      setSimilarCases([]);
    } finally {
      setSimilarLoading(false);
      setSwitchingCase(false);
    }
  };

  const generateSummary = async () => {
    if (!selectedCase || summarizing) return;
    setSummarizing(true);
    try {
      const source =
        selectedCase.fullText ||
        `${selectedCase.caseTitle}\nCourt: ${selectedCase.courtName}\nCitation: ${selectedCase.citation}\n\nFacts: ${selectedCase.facts || ''}\nSummary: ${selectedCase.summary || ''}`;
      setAiSummary(await aiTool('summarize-judgment', source));
    } catch (err) {
      setAiSummary(err.response?.data?.message || 'Could not summarize this judgment right now.');
    } finally {
      setSummarizing(false);
    }
  };

  const extractPrinciples = async () => {
    if (!selectedCase || extracting) return;
    setExtracting(true);
    try {
      const source =
        selectedCase.fullText ||
        `${selectedCase.caseTitle}\nCourt: ${selectedCase.courtName}\n\nFacts: ${selectedCase.facts || ''}\nSummary: ${selectedCase.summary || ''}`;
      setPrinciples(await aiTool('extract-principles', source));
    } catch (err) {
      setPrinciples(err.response?.data?.message || 'Could not extract principles right now.');
    } finally {
      setExtracting(false);
    }
  };

  const judgments = results?.judgments || [];
  const formatDate = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F5F5]">
      <div className="mx-auto max-w-5xl p-8">
        {/* ── Heading + Search Bar + Filters ── */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Case Laws — Pakistani Precedents</h1>
          <p className="text-sm text-gray-500">Search, read and understand court judgments from the repository.</p>

          <form onSubmit={handleSearch} className="mx-auto mt-6 max-w-3xl space-y-3">
            <div className="flex overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm focus-within:border-[#000000]">
              <div className="flex items-center pl-4 text-gray-400"><Search size={18} /></div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search judgments — e.g. bail, murder, due process, doctrine…"
                className="flex-1 border-none bg-transparent px-4 py-3.5 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={searching}
                className={`m-1.5 rounded-xl px-5 text-sm font-semibold transition ${
                  searching ? 'cursor-wait bg-gray-200 text-gray-500' : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>

            {/* Filters: Court / Year / Citation */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#000000]"
              >
                {COURTS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))}
                placeholder="Year — e.g. 2013"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#000000]"
              />
              <input
                type="text"
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                placeholder="Citation — e.g. SCMR 183"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#000000]"
              />
            </div>
          </form>
          {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
        </div>

        {/* ── Results ── */}
        {results && (
          <div className="space-y-3">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-500">
              {judgments.length} judgment{judgments.length === 1 ? '' : 's'} found
            </p>
            {judgments.length === 0 && (
              <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                No judgments matched your search. Try broader keywords, or clear the filters.
              </p>
            )}
            {judgments.map((judgment) => (
              <button
                key={judgment._id}
                type="button"
                onClick={() => openCase(judgment)}
                className="block w-full rounded-xl border border-gray-300 bg-white p-5 text-left shadow-sm transition hover:border-gray-500 hover:shadow"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-bold text-gray-900">{judgment.caseTitle}</span>
                  {judgment.citation && (
                    <span className="font-mono text-xs text-gray-600">{judgment.citation}</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                  <span className="font-medium">{judgment.courtName}</span>
                  {formatDate(judgment.judgmentDate || judgment.createdAt) && (
                    <span>· {formatDate(judgment.judgmentDate || judgment.createdAt)}</span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">{judgment.summary}</p>
              </button>
            ))}
          </div>
        )}

        {/* ── Judgment Detail Panel (full text + AI tools + similar cases) ── */}
        {selectedCase && (
          <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={() => setSelectedCase(null)}>
            <div
              className="h-full w-full max-w-xl overflow-y-auto bg-white p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="mb-6 flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft size={14} /> Back to results
              </button>

              <h2 className="text-2xl font-bold text-gray-900">{selectedCase.caseTitle}</h2>
              <p className="mt-1 text-xs text-gray-500">
                {[
                  selectedCase.courtName,
                  selectedCase.citation,
                  formatDate(selectedCase.judgmentDate || selectedCase.createdAt),
                ].filter(Boolean).join(' · ')}
              </p>

              {selectedCase.facts && (
                <div className="mt-5">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">Facts</p>
                  <p className="whitespace-pre-line rounded-xl border border-gray-300 bg-[#F5F5F5] p-4 text-sm leading-6 text-gray-800">
                    {selectedCase.facts}
                  </p>
                </div>
              )}

              {/* Full Judgment Text */}
              <div className="mt-5">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <ScrollText size={12} /> Full Judgment Text
                </p>
                <div className="max-h-96 overflow-y-auto whitespace-pre-line rounded-xl border border-gray-300 bg-[#F5F5F5] p-4 text-sm leading-6 text-gray-800">
                  {selectedCase.fullText || selectedCase.summary || 'Full text not available for this case.'}
                </div>
              </div>

              {/* AI action buttons */}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={generateSummary}
                  disabled={summarizing}
                  className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    summarizing ? 'cursor-wait bg-gray-200 text-gray-500' : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {summarizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {summarizing ? 'AI is summarizing…' : 'Generate AI Summary'}
                </button>
                <button
                  type="button"
                  onClick={extractPrinciples}
                  disabled={extracting}
                  className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    extracting ? 'cursor-wait bg-gray-200 text-gray-500' : 'border border-gray-400 bg-white text-gray-900 hover:border-black'
                  }`}
                >
                  {extracting ? <Loader2 size={16} className="animate-spin" /> : <Gavel size={16} />}
                  {extracting ? 'AI is extracting…' : 'Extract Legal Principles'}
                </button>
              </div>

              {/* AI Summary output */}
              {(aiSummary || summarizing) && (
                <div className="mt-5 rounded-xl border border-gray-300 bg-white p-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">AI Summary</p>
                  <p className="whitespace-pre-line text-sm leading-7 text-gray-800">{aiSummary}</p>
                </div>
              )}

              {/* Legal Principles output */}
              {(principles || extracting) && (
                <div className="mt-5 rounded-xl border border-gray-300 bg-white p-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Legal Principles</p>
                  <p className="whitespace-pre-line text-sm leading-7 text-gray-800">{principles}</p>
                </div>
              )}

              {/* Similar Cases */}
              <div className="mt-8 border-t border-gray-200 pt-5">
                <p className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <FileText size={12} /> Similar Cases
                </p>
                {similarLoading ? (
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 size={14} className="animate-spin" /> Finding related precedents…
                  </p>
                ) : similarCases.length ? (
                  <div className="space-y-2">
                    {similarCases.map((similar) => (
                      <button
                        key={similar._id}
                        type="button"
                        onClick={() => { setSwitchingCase(true); openCase(similar); }}
                        className="block w-full rounded-lg border border-gray-200 bg-[#F5F5F5] px-4 py-3 text-left transition hover:border-gray-500"
                      >
                        <span className="text-xs font-semibold text-gray-900">{similar.caseTitle}</span>
                        {similar.citation && (
                          <span className="ml-2 font-mono text-[10px] text-gray-600">{similar.citation}</span>
                        )}
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{similar.summary}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No related precedents found in the repository.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
