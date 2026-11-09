import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Filter,
  Loader2,
  Quote,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

const CATEGORIES = ['Criminal', 'Civil', 'Constitutional', 'Family', 'General'];

const POPULAR_TERMS = ['Murder', 'Bail', 'Article', 'FIR', 'Contract', 'Injunction'];

const AI_WARNING = 'AI-generated definition based on Pakistani Law. Please verify from official sources.';

const FAVOURITES_KEY = 'case_lens_dictionary_favourites';

const readFavourites = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVOURITES_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Highlight the typed query inside a term name without breaking the text.
const renderHighlighted = (text, query) => {
  const needle = String(query || '').trim();
  if (!needle) return text;

  const parts = String(text).split(new RegExp(`(${escapeRegex(needle)})`, 'i'));
  const lowerNeedle = needle.toLowerCase();

  return parts.map((part, index) =>
    part.toLowerCase() === lowerNeedle ? (
      <mark key={index} className="rounded bg-black px-0.5 text-white">
        {part}
      </mark>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    )
  );
};

// ─── Term card ────────────────────────────────────────────────────────────────

function TermCard({ term, query, favourite, active, onOpen, onToggleFavourite }) {
  return (
    <article
      className={`group relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition ${
        active
          ? 'border-black ring-1 ring-black/5'
          : 'border-[#E5E5E5] hover:border-black/30 hover:shadow-md'
      }`}
    >
      {/* Full-card click target sits behind the content. */}
      <button
        type="button"
        onClick={() => onOpen(term)}
        className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        aria-label={`View details for ${term.term}`}
      />

      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-[#E5E5E5] bg-[#F5F5F5] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-600">
              {term.category}
            </span>
            <h3 className="mt-2 text-lg font-bold leading-tight text-[#1A1A1A]">
              {renderHighlighted(term.term, query)}
            </h3>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavourite(term.term);
            }}
            aria-pressed={favourite}
            aria-label={favourite ? `Remove ${term.term} from bookmarks` : `Bookmark ${term.term}`}
            title={favourite ? 'Remove bookmark' : 'Bookmark this term'}
            className={`pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
              favourite
                ? 'border-black bg-black text-white'
                : 'border-[#E5E5E5] bg-white text-gray-400 hover:border-black hover:text-black'
            }`}
          >
            <Bookmark size={15} className={favourite ? 'fill-current' : ''} aria-hidden="true" />
          </button>
        </div>

        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-gray-600">
          {term.englishDefinition}
        </p>

        <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-black">
          Read more
          <ArrowRight
            size={12}
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </article>
  );
}

// ─── Detail side panel ────────────────────────────────────────────────────────

function DetailPanel({ term, favourite, onClose, onToggleFavourite, onRelated }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dictionary-term-title"
    >
      <button
        type="button"
        aria-label="Close term details"
        onClick={onClose}
        className="absolute inset-0 animate-dictionary-fade-in cursor-default bg-black/40"
      />

      <aside className="animate-dictionary-panel-in relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[#E5E5E5] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Legal Dictionary
            </p>
            <h2
              id="dictionary-term-title"
              className="mt-0.5 truncate text-lg font-bold text-[#1A1A1A]"
            >
              {term.term}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavourite(term.term)}
              aria-pressed={favourite}
              aria-label={favourite ? 'Remove bookmark' : 'Bookmark this term'}
              title={favourite ? 'Remove bookmark' : 'Bookmark this term'}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                favourite
                  ? 'border-black bg-black text-white'
                  : 'border-[#E5E5E5] bg-white text-gray-500 hover:border-black hover:text-black'
              }`}
            >
              <Bookmark size={15} className={favourite ? 'fill-current' : ''} aria-hidden="true" />
            </button>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close term details"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-gray-500 transition hover:border-black hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              {term.category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-[#F5F5F5] px-2.5 py-1 text-[10px] font-semibold text-gray-600">
              <BookOpen size={11} aria-hidden="true" />
              Pakistani law
            </span>
            {term.aiGenerated && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                <Sparkles size={11} aria-hidden="true" />
                AI generated
              </span>
            )}
          </div>

          {term.aiGenerated && (
            <div
              role="status"
              className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{AI_WARNING}</span>
            </div>
          )}

          <section className="mt-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
              English Definition
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{term.englishDefinition}</p>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                Urdu Explanation
              </h3>
              <span
                dir="rtl"
                lang="ur"
                className="font-urdu rounded-full border border-[#E5E5E5] bg-[#F5F5F5] px-2.5 py-0.5 text-[11px] font-semibold text-gray-700"
              >
                اردو
              </span>
            </div>

            {term.urduExplanation ? (
              <div
                dir="rtl"
                lang="ur"
                className="font-urdu mt-2 rounded-2xl border border-[#E5E5E5] bg-[#FCFCFC] px-4 py-4 text-right text-[17px] leading-[2.35] text-[#1A1A1A] sm:px-5"
              >
                {term.urduExplanation}
              </div>
            ) : (
              <p className="mt-2 rounded-2xl border border-dashed border-[#E5E5E5] px-4 py-3 text-xs text-gray-500">
                Urdu explanation is not available for this term yet.
              </p>
            )}
          </section>

          {term.example && (
            <section className="mt-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                Example
              </h3>
              <div className="mt-2 flex gap-3 rounded-2xl border-l-4 border-black bg-[#F5F5F5] px-4 py-3.5">
                <Quote size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                <p className="text-sm italic leading-relaxed text-gray-700">{term.example}</p>
              </div>
            </section>
          )}

          <section className="mt-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Related Terms
            </h3>
            {term.relatedTerms?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {term.relatedTerms.map((related) => (
                  <button
                    key={related}
                    type="button"
                    onClick={() => onRelated(related)}
                    className="group inline-flex items-center gap-1 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-black hover:bg-black hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    {related}
                    <ChevronRight
                      size={12}
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500">No related terms recorded for this entry.</p>
            )}
          </section>
        </div>

        <footer className="border-t border-[#E5E5E5] px-5 py-3 text-[10px] leading-relaxed text-gray-500 sm:px-6">
          General legal information for reference only — always verify against the latest statutes
          and case law before relying on it.
        </footer>
      </aside>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LegalDictionary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [searchNonce, setSearchNonce] = useState(0);

  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // The filters that produced the results currently on screen. Keeps the result
  // label in sync with the cards during the 300ms debounce window.
  const [loadedFilter, setLoadedFilter] = useState({ query: '', category: '' });

  const [selectedTerm, setSelectedTerm] = useState(null);
  const [favourites, setFavourites] = useState(readFavourites);
  const [showFavourites, setShowFavourites] = useState(false);

  // AI fallback state — populated only when the local DB has no match.
  const [notFound, setNotFound] = useState(false);
  const [notFoundQuery, setNotFoundQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiTerm, setAiTerm] = useState(null);

  const selectedName = selectedTerm?.term || '';

  // Persist bookmarks locally (frontend-only, as specified).
  useEffect(() => {
    try {
      localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
    } catch {
      /* storage may be unavailable in private mode — bookmarks still work in memory */
    }
  }, [favourites]);

  const fetchTerms = useCallback(async ({ searchQuery, searchCategory, signal }) => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (searchCategory) params.category = searchCategory;

      const response = await axios.get('/api/dictionary/search', {
        params,
        signal,
        timeout: 20000,
      });

      if (signal?.aborted) return;
      const incoming = Array.isArray(response.data?.data) ? response.data.data : [];
      setTerms(incoming);
      setLoadedFilter({
        query: searchQuery.trim(),
        category: searchCategory || '',
      });

      // The API flags a genuine miss only when a text query returned nothing.
      const missed = Boolean(response.data?.notFoundInLocalDb) && incoming.length === 0;
      setNotFound(missed);
      setNotFoundQuery(missed ? searchQuery.trim() : '');
      setAiTerm(null);
      setAiError('');
      setAiLoading(false);
    } catch (requestError) {
      if (signal?.aborted || axios.isCancel?.(requestError) || requestError.code === 'ERR_CANCELED') {
        return;
      }
      setTerms([]);
      setNotFound(false);
      setNotFoundQuery('');
      setAiTerm(null);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to load the legal dictionary. Please try again.'
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  // Debounced search: fires on typing, category changes and explicit submits.
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetchTerms({
        searchQuery: query,
        searchCategory: category,
        signal: controller.signal,
      });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, category, searchNonce, fetchTerms]);

  // Close the panel on Escape and lock background scrolling while it is open.
  useEffect(() => {
    if (!selectedTerm) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedTerm(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedTerm]);

  // Fetch canonical details from GET /api/dictionary/term/:term when opening a
  // card. The card already has full data, so a failure is non-blocking.
  const handleOpenTerm = async (term) => {
    setSelectedTerm(term);

    try {
      const response = await axios.get(
        `/api/dictionary/term/${encodeURIComponent(term.term)}`,
        { timeout: 15000 }
      );
      const detailed = response.data?.data;
      if (detailed) {
        setSelectedTerm((current) => (current?.term === term.term ? detailed : current));
      }
    } catch {
      /* keep the data already shown on the card */
    }
  };

  const handleToggleFavourite = (termName) => {
    setFavourites((current) =>
      current.includes(termName)
        ? current.filter((item) => item !== termName)
        : [...current, termName]
    );
  };

  const handleQuickSearch = (termName) => {
    setQuery(termName);
    setCategory('');
    setShowFavourites(false);
    setSearchNonce((value) => value + 1);
  };

  const handleRelatedTerm = (termName) => {
    setSelectedTerm(null);
    handleQuickSearch(termName);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSearchNonce((value) => value + 1);
  };

  const handleGenerateDefinition = async () => {
    const termName = (notFoundQuery || loadedFilter.query || query).trim();
    if (!termName || aiLoading) return;

    setAiLoading(true);
    setAiError('');

    try {
      const response = await axios.post(
        '/api/ai/define-term',
        { term: termName },
        { timeout: 60000 }
      );

      const generated = response.data?.data;
      if (!generated?.englishDefinition) {
        throw new Error('The AI did not return a usable definition. Please try again.');
      }

      setAiTerm({
        ...generated,
        term: generated.term || termName,
        category: generated.category || 'General',
        relatedTerms: generated.relatedTerms || [],
        aiGenerated: true,
      });
    } catch (requestError) {
      setAiError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to generate a definition right now. Please try again.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const visibleTerms = useMemo(
    () => (showFavourites ? terms.filter((term) => favourites.includes(term.term)) : terms),
    [terms, showFavourites, favourites]
  );

  const resultLabel = useMemo(() => {
    if (loading) return 'Searching…';
    const count = visibleTerms.length;
    const noun = count === 1 ? 'term' : 'terms';
    if (showFavourites) return `${count} bookmarked ${noun}`;
    if (loadedFilter.query) return `${count} ${noun} found for “${loadedFilter.query}”`;
    if (loadedFilter.category) return `${count} ${noun} in ${loadedFilter.category}`;
    return `${count} legal ${noun} available`;
  }, [loading, visibleTerms.length, showFavourites, loadedFilter]);

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F5F5] text-[#1A1A1A]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Drafting &amp; Reference
            </p>
            <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-bold sm:text-3xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                <BookOpen size={20} strokeWidth={1.9} aria-hidden="true" />
              </span>
              Legal Dictionary
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
              Understand Pakistani legal terms through plain English definitions, Urdu
              explanations, practical examples and linked concepts.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
            <Sparkles size={12} aria-hidden="true" />
            Bilingual Reference
          </span>
        </header>

        {/* ── Search hero ─────────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-[#E5E5E5] bg-white p-5 shadow-sm sm:p-7">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-[#F5F5F5] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-600">
                <BookOpen size={11} aria-hidden="true" />
                Pakistani legal reference
              </span>
              <h2 className="mt-3 text-xl font-bold sm:text-2xl">
                Find the meaning of any legal term
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                Search English definitions, Urdu explanations, examples and related terms.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search a term, e.g. Bail, Precedent, FIR..."
                  aria-label="Search legal terms"
                  className="w-full rounded-xl border border-[#E5E5E5] bg-white py-3.5 pl-11 pr-10 text-sm text-[#1A1A1A] outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/5"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-[#F5F5F5] hover:text-black"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="relative sm:w-52">
                <Filter
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  aria-label="Filter by category"
                  className="w-full appearance-none rounded-xl border border-[#E5E5E5] bg-white py-3.5 pl-10 pr-9 text-sm text-[#1A1A1A] outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <Search size={16} aria-hidden="true" />
                Search
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-gray-500">
              <span className="font-semibold">Popular:</span>
              {POPULAR_TERMS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleQuickSearch(term)}
                  className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-1 font-medium text-gray-600 transition hover:border-black hover:text-black"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Results toolbar ─────────────────────────────────────────────── */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">{showFavourites ? 'Bookmarked Terms' : 'Legal Terms'}</h2>
            <p className="mt-0.5 truncate text-[11px] text-gray-500">{resultLabel}</p>
          </div>

          <button
            type="button"
            onClick={() => setShowFavourites((value) => !value)}
            aria-pressed={showFavourites}
            className={`inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              showFavourites
                ? 'border-black bg-black text-white'
                : 'border-[#E5E5E5] bg-white text-black hover:bg-[#F5F5F5]'
            }`}
          >
            <Bookmark
              size={14}
              className={showFavourites ? 'fill-current' : ''}
              aria-hidden="true"
            />
            {showFavourites ? 'Show all terms' : `Bookmarks (${favourites.length})`}
          </button>
        </div>

        {/* ── Results ─────────────────────────────────────────────────────── */}
        <div className="mt-3">
          {error && (
            <div
              role="alert"
              className="mb-4 flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-start gap-2 leading-relaxed">
                <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                {error}
              </span>
              <button
                type="button"
                onClick={() => setSearchNonce((value) => value + 1)}
                className="w-fit shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 font-semibold text-red-700 transition hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-[#E5E5E5] bg-white p-5"
                >
                  <div className="h-4 w-20 rounded-full bg-[#F0F0F0]" />
                  <div className="mt-3 h-5 w-2/3 rounded bg-[#F0F0F0]" />
                  <div className="mt-3 h-3 w-full rounded bg-[#F0F0F0]" />
                  <div className="mt-2 h-3 w-4/5 rounded bg-[#F0F0F0]" />
                </div>
              ))}
            </div>
          ) : error ? null : visibleTerms.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleTerms.map((term) => (
                <TermCard
                  key={term._id || term.term}
                  term={term}
                  query={query}
                  favourite={favourites.includes(term.term)}
                  active={selectedName === term.term}
                  onOpen={handleOpenTerm}
                  onToggleFavourite={handleToggleFavourite}
                />
              ))}
            </div>
          ) : showFavourites ? (
            <div className="rounded-3xl border border-[#E5E5E5] bg-white px-6 py-14 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F5] text-gray-400">
                <Bookmark size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold">No bookmarked terms yet</h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-gray-600">
                Tap the bookmark icon on any term card to keep it here for quick reference.
              </p>
              <button
                type="button"
                onClick={() => setShowFavourites(false)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
              >
                Browse all terms
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          ) : notFound ? (
            <div className="rounded-3xl border border-[#E5E5E5] bg-white px-5 py-10 text-center shadow-sm sm:px-8">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F5] text-gray-400">
                <Search size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold">
                “{notFoundQuery}” is not in the local dictionary
              </h3>
              <p className="mx-auto mt-1.5 max-w-lg text-sm leading-relaxed text-gray-600">
                You can generate a definition of this term based on Pakistani law (PPC, CrPC and the
                Constitution of Pakistan). AI output is for reference only.
              </p>

              {!aiTerm && (
                <button
                  type="button"
                  onClick={handleGenerateDefinition}
                  disabled={aiLoading}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aiLoading ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles size={14} aria-hidden="true" />
                  )}
                  {aiLoading ? 'Generating definition…' : 'Generate AI Definition'}
                </button>
              )}

              {aiError && (
                <div
                  role="alert"
                  className="mx-auto mt-4 flex max-w-lg flex-col items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 sm:flex-row sm:justify-between"
                >
                  <span className="flex items-start gap-2 text-left leading-relaxed">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {aiError}
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateDefinition}
                    className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Retry
                  </button>
                </div>
              )}

              {aiTerm && (
                <div className="mt-6 text-left">
                  <div
                    role="status"
                    className="flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900"
                  >
                    <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{AI_WARNING}</span>
                  </div>

                  <section className="mt-5">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      English Definition
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-gray-700">
                      {aiTerm.englishDefinition}
                    </p>
                  </section>

                  {aiTerm.urduExplanation && (
                    <section className="mt-5">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                        Urdu Explanation
                      </h4>
                      <div
                        dir="rtl"
                        lang="ur"
                        className="font-urdu mt-2 rounded-2xl border border-[#E5E5E5] bg-[#FCFCFC] px-4 py-4 text-right text-[17px] leading-[2.35] text-[#1A1A1A]"
                      >
                        {aiTerm.urduExplanation}
                      </div>
                    </section>
                  )}

                  {aiTerm.example && (
                    <section className="mt-5">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                        Example
                      </h4>
                      <div className="mt-2 flex gap-3 rounded-2xl border-l-4 border-black bg-[#F5F5F5] px-4 py-3.5">
                        <Quote
                          size={16}
                          className="mt-0.5 shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                        <p className="text-sm italic leading-relaxed text-gray-700">
                          {aiTerm.example}
                        </p>
                      </div>
                    </section>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedTerm(aiTerm)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-black bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-black hover:text-white"
                  >
                    Open full view
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500">Try instead:</span>
                {POPULAR_TERMS.slice(0, 5).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleQuickSearch(term)}
                    className="rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-black hover:bg-black hover:text-white"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-[#E5E5E5] bg-white px-6 py-14 text-center shadow-sm">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F5F5] text-gray-400">
                <Search size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold">No terms found</h3>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-gray-600">
                No terms match the selected filters.
                {category ? ` You are filtering by ${category}.` : ''}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {POPULAR_TERMS.slice(0, 5).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleQuickSearch(term)}
                    className="rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-black hover:bg-black hover:text-white"
                  >
                    {term}
                  </button>
                ))}
              </div>

              {(query || category) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setCategory('');
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                >
                  Clear filters
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 flex items-start gap-1.5 text-[10px] leading-relaxed text-gray-500">
          <Sparkles size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          Definitions reflect general Pakistani legal usage. Statutes, rules and precedent should
          always be checked before advising a client or filing in court.
        </p>
      </div>

      {selectedTerm && (
        <DetailPanel
          term={selectedTerm}
          favourite={favourites.includes(selectedTerm.term)}
          onClose={() => setSelectedTerm(null)}
          onToggleFavourite={handleToggleFavourite}
          onRelated={handleRelatedTerm}
        />
      )}
    </main>
  );
}
