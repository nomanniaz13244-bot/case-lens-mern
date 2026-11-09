import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Loader2, Search, Sparkles, X } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const getAuthToken = () =>
  localStorage.getItem('case_lens_token') || localStorage.getItem('token');

// POST /api/ai/explain-law — protected route, so send the JWT
async function aiExplain(text, instruction) {
  const token = getAuthToken();
  const response = await axios.post(
    `${API_BASE}/ai/explain-law`,
    { text, instruction },
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 60000,
    }
  );
  return response.data?.data?.answer || response.data?.answer || '';
}

export default function LegalResearch() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('statutes');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Statute side-panel state
  const [selectedStatute, setSelectedStatute] = useState(null);
  const [statuteExplanation, setStatuteExplanation] = useState('');
  const [explaining, setExplaining] = useState(false);

  // Judgment full-text view state
  const [selectedJudgment, setSelectedJudgment] = useState(null);
  const [judgmentLoading, setJudgmentLoading] = useState(false);
  const [judgmentSummary, setJudgmentSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearching(true);
    setError('');
    setSelectedStatute(null);
    setSelectedJudgment(null);
    try {
      const response = await axios.get(`${API_BASE}/research/search`, {
        params: { query: trimmed },
        timeout: 20000,
      });
      setResults({
        statutes: response.data?.statutes || [],
        judgments: response.data?.judgments || [],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed. Is the backend running on port 5000?');
    } finally {
      setSearching(false);
    }
  };

  const showStatute = (statute) => {
    setSelectedStatute(statute);
    setStatuteExplanation('');
  };

  const explainStatute = async () => {
    if (!selectedStatute || explaining) return;
    setExplaining(true);
    try {
      const text = `${selectedStatute.sectionNumber} — ${selectedStatute.actName}\n` +
        `${selectedStatute.title || ''}\n\n${selectedStatute.sectionText}`;
      setStatuteExplanation(await aiExplain(text, ''));
    } catch (err) {
      setStatuteExplanation(err.response?.data?.message || 'Could not explain this section right now.');
    } finally {
      setExplaining(false);
    }
  };

  const showJudgment = async (judgment) => {
    setSelectedJudgment({ ...judgment, fullText: '' });
    setJudgmentSummary('');
    setJudgmentLoading(true);
    try {
      // Public route: full document incl. fullText
      const response = await axios.get(`${API_BASE}/search/${judgment._id}`, { timeout: 20000 });
      setSelectedJudgment((prev) => ({ ...prev, ...(response.data?.data || {}) }));
    } catch (err) {
      setSelectedJudgment((prev) => ({ ...prev, fullText: prev.summary || '' }));
    } finally {
      setJudgmentLoading(false);
    }
  };

  const summarizeJudgment = async () => {
    const source =
      selectedJudgment?.fullText ||
      selectedJudgment?.facts ||
      selectedJudgment?.summary;
    if (!source || summarizing) return;
    setSummarizing(true);
    try {
      setJudgmentSummary(await aiExplain(
        `Case Title: ${selectedJudgment.caseTitle}\nCourt: ${selectedJudgment.courtName}\n\n${source}`,
        'Summarize this Pakistani court judgment for a practicing lawyer in simple language: overview, key facts, legal issues, laws applied, and final outcome. Do not invent facts or laws that are not in the text.'
      ));
    } catch (err) {
      setJudgmentSummary(err.response?.data?.message || 'Could not summarize this judgment right now.');
    } finally {
      setSummarizing(false);
    }
  };

  const statutes = results?.statutes || [];
  const judgments = results?.judgments || [];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F5F5]">
      <div className="mx-auto max-w-5xl p-8">
        {/* ── Heading + Search Bar ── */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Search Pakistani Laws &amp; Judgments</h1>
          <p className="text-sm text-gray-500">
            Research statutes and court judgments globally — no uploaded case required.
          </p>
          <form onSubmit={handleSearch} className="mx-auto mt-6 max-w-2xl">
            <div className="flex overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm focus-within:border-[#000000]">
              <div className="flex items-center pl-4 text-gray-400"><Search size={18} /></div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Section 497, murder bail, Article 199 writ…"
                className="flex-1 border-none bg-transparent px-4 py-3.5 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className={`m-1.5 rounded-xl px-5 text-sm font-semibold transition ${
                  searching || !query.trim()
                    ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>
          </form>
          {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
        </div>

        {/* ── Results ── */}
        {results && (
          <div>
            {/* Tabs */}
            <div className="mb-5 flex justify-center gap-2">
              {[
                { id: 'statutes', label: `Statutes (Laws) — ${statutes.length}`, icon: BookOpen },
                { id: 'judgments', label: `Judgments (Cases) — ${judgments.length}`, icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-black text-white shadow-sm'
                      : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Statutes list */}
            {activeTab === 'statutes' && (
              <div className="space-y-3">
                {statutes.length === 0 && (
                  <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                    No statutes matched your search. Try a section number (e.g. "497") or an act name (e.g. "Penal Code").
                  </p>
                )}
                {statutes.map((statute) => (
                  <button
                    key={statute._id}
                    type="button"
                    onClick={() => showStatute(statute)}
                    className="block w-full rounded-xl border border-gray-300 bg-white p-5 text-left shadow-sm transition hover:border-gray-500 hover:shadow"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-bold text-gray-900">{statute.sectionNumber}</span>
                      <span className="font-mono text-xs text-gray-600">{statute.actName}</span>
                    </div>
                    {statute.title && <p className="mt-1 text-sm font-medium text-gray-800">{statute.title}</p>}
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">{statute.sectionText}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Judgments list */}
            {activeTab === 'judgments' && (
              <div className="space-y-3">
                {judgments.length === 0 && (
                  <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                    No judgments matched your search. Try keywords like "murder", "bail" or a case title.
                  </p>
                )}
                {judgments.map((judgment) => (
                  <button
                    key={judgment._id}
                    type="button"
                    onClick={() => showJudgment(judgment)}
                    className="block w-full rounded-xl border border-gray-300 bg-white p-5 text-left shadow-sm transition hover:border-gray-500 hover:shadow"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-bold text-gray-900">{judgment.caseTitle}</span>
                      {judgment.citation && <span className="font-mono text-xs text-gray-600">{judgment.citation}</span>}
                    </div>
                    <p className="mt-1 text-xs font-medium text-gray-500">{judgment.courtName}</p>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">{judgment.summary}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Statute Side Panel ── */}
        {selectedStatute && (
          <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={() => setSelectedStatute(null)}>
            <div
              className="h-full w-full max-w-xl overflow-y-auto bg-white p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-gray-500">{selectedStatute.actName}</p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900">
                    {selectedStatute.sectionNumber}
                    {selectedStatute.title ? ` — ${selectedStatute.title}` : ''}
                  </h2>
                </div>
                <button type="button" onClick={() => setSelectedStatute(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>

              <p className="mb-6 rounded-xl border border-gray-300 bg-[#F5F5F5] p-5 text-sm leading-7 text-gray-800 whitespace-pre-line">
                {selectedStatute.sectionText}
              </p>

              <button
                type="button"
                onClick={explainStatute}
                disabled={explaining}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  explaining ? 'cursor-wait bg-gray-200 text-gray-500' : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {explaining ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {explaining ? 'AI is thinking…' : 'Explain with AI'}
              </button>

              {(explaining || statuteExplanation) && (
                <div className="mt-6 rounded-xl border border-gray-300 bg-white p-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">AI Explanation</p>
                  {explaining ? (
                    <p className="text-sm text-gray-500">Reading … analyzing the plain text of this section</p>
                  ) : (
                    <p className="whitespace-pre-line text-sm leading-7 text-gray-800">{statuteExplanation}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Judgment full-text view ── */}
        {selectedJudgment && (
          <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={() => setSelectedJudgment(null)}>
            <div
              className="h-full w-full max-w-xl overflow-y-auto bg-white p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedJudgment(null)}
                className="mb-6 flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft size={14} /> Back to results
              </button>

              <h2 className="text-2xl font-bold text-gray-900">{selectedJudgment.caseTitle}</h2>
              <p className="mt-1 text-xs text-gray-500">
                {[selectedJudgment.courtName, selectedJudgment.citation].filter(Boolean).join(' · ')}
              </p>

              {judgmentLoading ? (
                <p className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={14} className="animate-spin" /> Loading full text…
                </p>
              ) : (
                <p className="mt-6 whitespace-pre-line rounded-xl border border-gray-300 bg-[#F5F5F5] p-5 text-sm leading-7 text-gray-800">
                  {selectedJudgment.fullText || selectedJudgment.facts || selectedJudgment.summary}
                </p>
              )}

              <button
                type="button"
                onClick={summarizeJudgment}
                disabled={summarizing}
                className={`mt-6 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  summarizing ? 'cursor-wait bg-gray-200 text-gray-500' : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {summarizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {summarizing ? 'AI is summarizing…' : 'Summarize with AI'}
              </button>

              {(summarizing || judgmentSummary) && (
                <div className="mt-6 rounded-xl border border-gray-300 bg-white p-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">AI Summary</p>
                  <p className="whitespace-pre-line text-sm leading-7 text-gray-800">{judgmentSummary}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
