import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/search';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [meta, setMeta] = useState({ total: 0, searchMode: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setError('Please enter a search term to begin.');
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await axios.get(API_BASE_URL, { params: { q: trimmed } });

      if (res.data && res.data.success) {
        setResults(res.data.data || []);
        setMeta({
          total: res.data.total || 0,
          searchMode: res.data.searchMode || '',
        });
      } else {
        setResults([]);
        setMeta({ total: 0, searchMode: '' });
        setError(res.data?.message || 'Search failed. Please try again.');
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Could not reach the search service. Ensure the backend is running on port 5000.';
      setError(message);
      setResults([]);
      setMeta({ total: 0, searchMode: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans bg-white">
      <header className="border-b border-black bg-[#F5F5F5] text-gray-900 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-lg font-black bg-white">
              CL
            </span>
            <div>
              <h1 className="text-lg font-bold leading-tight">Case Lens AI</h1>
              <p className="text-xs bg-white">Legal Research &amp; Precedent Search</p>
            </div>
          </div>
          <Link
            to="/workspace"
            className="rounded-md border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            New Case
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16">
        <section className="-mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <h2 className="text-center text-2xl font-extrabold tracking-tight bg-white sm:text-3xl">
            Search Legal Precedents
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-gray-700">
            Search by case title, citation, court, keywords or judgment summary.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-6 max-w-3xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Miranda rights, PLD 2024 SC 182, Supreme Court..."
                className="w-full flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm bg-white shadow-sm outline-none transition placeholder:text-gray-600 focus:bg-white focus:ring-0 focus:border-black"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800 focus:outline-none focus:ring-0 focus:border-black disabled:cursor-not-allowed disabled:bg-[#9ca3af]"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-bold">!</span>
            <span>{error}</span>
          </div>
        )}

        {searched && !loading && !error && (
          <p className="mt-6 text-sm text-gray-700">
            {meta.total} result{meta.total === 1 ? '' : 's'} found
            {meta.searchMode ? ` \u00b7 mode: ${meta.searchMode}` : ''}
          </p>
        )}

        {loading && (
          <div className="mt-8 space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-[#d1d5db] bg-white p-6"
              >
                <div className="h-5 w-2/3 rounded bg-[#e5e7eb]" />
                <div className="mt-3 h-4 w-1/3 rounded bg-[#e5e7eb]" />
                <div className="mt-4 h-4 w-full rounded bg-[#F5F5F5]" />
                <div className="mt-2 h-4 w-5/6 rounded bg-[#F5F5F5]" />
              </div>
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="mt-4 space-y-4">
            {results.map((item) => (
              <Link
                key={item._id}
                to={`/case-detail/${item._id}`}
                className="block rounded-xl border border-[#d1d5db] bg-white p-6 shadow-sm transition bg-white hover:shadow-md focus:outline-none focus:ring-0 focus:border-black"
                aria-label={`View case details for ${item.caseTitle}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-bold bg-white">{item.caseTitle}</h3>
                  {item.citation && (
                    <span className="rounded-md bg-white px-2.5 py-1 font-mono text-xs font-semibold bg-white">
                      {item.citation}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  {item.courtName && (
                    <span className="font-semibold bg-white">{item.courtName}</span>
                  )}
                  {item.caseType && (
                    <span className="rounded-full bg-[#F5F5F5] px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {item.caseType}
                    </span>
                  )}
                  {item.decisionDate && (
                    <span className="text-xs text-gray-600">
                      {new Date(item.decisionDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                {item.summary && (
                  <p className="mt-3 text-sm leading-relaxed text-gray-700">{item.summary}</p>
                )}

                {Array.isArray(item.keywords) && item.keywords.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-[#d1d5db] bg-[#F5F5F5] px-2 py-0.5 text-xs text-gray-700"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {!loading && searched && !error && results.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <h3 className="text-lg font-semibold bg-white">No matching cases</h3>
            <p className="mt-1 text-sm text-gray-700">
              Try a different keyword, citation, or court name.
            </p>
          </div>
        )}

        {!searched && !loading && (
          <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <h3 className="text-lg font-semibold bg-white">Start your research</h3>
            <p className="mt-1 text-sm text-gray-700">
              Enter a legal term above to search indexed judgments and precedents.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
