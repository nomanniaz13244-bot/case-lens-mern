import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MyCases() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);


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

  const handleDelete = async (legalCase) => {
    if (deletingId) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete this case? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(legalCase._id);
    try {
      const authToken =
        token ||
        localStorage.getItem('case_lens_token') ||
        localStorage.getItem('token');
      if (!authToken) {
        setError('You are not logged in — no auth token found. Please log in again.');
        setDeletingId(null);
        return;
      }
      await axios.delete(`http://localhost:5000/api/cases/${legalCase._id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log('Case deleted:', legalCase._id);
      // Remove from state immediately so the card disappears without a reload.
      setCases((prev) => prev.filter((item) => item._id !== legalCase._id));
    } catch (deleteError) {
      console.error('Delete Error:', deleteError.response?.data || deleteError.message);
      setError(
        deleteError.response?.data?.message ||
          'Unable to delete this case. Please try again.'
      );
    } finally {
      setDeletingId(null);
    }
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

        {error && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

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
              <article key={legalCase._id} className="group relative rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
                {/* Delete icon — subtle until hover */}
                <button
                  type="button"
                  onClick={() => handleDelete(legalCase)}
                  disabled={deletingId === legalCase._id}
                  title="Delete case"
                  className={`absolute top-4 right-4 rounded-lg p-2 transition ${
                    deletingId === legalCase._id
                      ? 'cursor-wait text-gray-400'
                      : 'text-gray-300 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  {deletingId === legalCase._id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>

                <h2 className="text-lg font-bold text-gray-900">{legalCase.caseTitle || 'Untitled Case'}</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div><dt className="text-xs font-semibold uppercase text-gray-600">Citation</dt><dd className="mt-1 break-words text-gray-900">{legalCase.citation || 'Not available'}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase text-gray-600">Court Name</dt><dd className="mt-1 text-gray-900">{legalCase.courtName || 'Not available'}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase text-gray-600">Date Added</dt><dd className="mt-1 text-gray-900">{formatDate(legalCase.createdAt)}</dd></div>
                </dl>
                <button
                  type="button"
                  onClick={() => navigate(`/case-detail/${legalCase._id}`)}
                  disabled={Boolean(deletingId)}
                  className="mt-5 w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
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
