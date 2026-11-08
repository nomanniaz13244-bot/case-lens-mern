import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MyCases() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const authToken =
          token ||
          localStorage.getItem('case_lens_token') ||
          localStorage.getItem('token');
        const response = await axios.get('/api/workspace/my-cases', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setCases(response.data?.data || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load your cases.');
      } finally {
        setLoading(false);
      }
    };

    if (token || localStorage.getItem('case_lens_token') || localStorage.getItem('token')) fetchCases();
    else setLoading(false);
  }, [token]);

  const formatDate = (value) => {
    if (!value) return 'Not available';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString();
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F5F5] px-4 py-8 text-gray-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-600">User Workspace</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">My Cases</h1>
          </div>
          <Link to="/workspace" className="rounded-lg bg-black px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-gray-800">
            Create New Case
          </Link>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-300 bg-white p-10 text-center text-gray-600">Loading your cases...</div>
        ) : error ? (
          <div className="rounded-xl border border-gray-300 bg-white p-10 text-center text-gray-900">{error}</div>
        ) : cases.length === 0 ? (
          <div className="rounded-2xl border border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-xl font-bold">No cases yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">Create your first case to begin AI analysis, legal issue mapping, and case management.</p>
            <Link to="/workspace" className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">Create New Case</Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cases.map((legalCase) => (
              <article key={legalCase._id} className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">{legalCase.caseTitle || 'Untitled Case'}</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div><dt className="text-xs font-semibold uppercase text-gray-600">Citation</dt><dd className="mt-1 break-words text-gray-900">{legalCase.citation || 'Not available'}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase text-gray-600">Court Name</dt><dd className="mt-1 text-gray-900">{legalCase.courtName || 'Not available'}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase text-gray-600">Date Added</dt><dd className="mt-1 text-gray-900">{formatDate(legalCase.createdAt)}</dd></div>
                </dl>
                <button
                  type="button"
                  onClick={() => navigate(`/case-detail/${legalCase._id}`)}
                  className="mt-5 w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  View Workspace
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
