import React from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm text-slate-400 font-medium">Loading your legal workspace...</span>
        </div>
      </div>
    );
  }

  // Protected route check
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Legal Session
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Welcome, {user.fullName || 'Counsel'}!
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl">
                Here is your Case Lens AI command center. Search precedent rulings, run semantic queries, and conduct multi-turn case research.
              </p>
            </div>

            {/* Credits & Action Widget */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3.5 pr-2 sm:border-r sm:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white text-xl shadow-lg shadow-amber-500/20">
                  ⚡
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Available Credits
                  </div>
                  <div className="text-2xl font-black text-amber-400 flex items-baseline gap-1">
                    {user.credits ?? 25}
                    <span className="text-xs text-slate-400 font-medium">Credits</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>⚡</span>
            <span>Quick Workspaces</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Legal Search Card */}
            <Link
              to="/"
              className="group relative p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-108 transition-transform">
                  🔍
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">
                  Legal Case Search
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Search legal precedents across High Courts and Supreme Court with filters for year, jurisdiction, and citation.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-sky-400 gap-1.5">
                <span>Launch Search</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* AI Legal Chat Card */}
            <Link
              to="/ai-chat"
              className="group relative p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-108 transition-transform">
                  🤖
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                  AI Legal Assistant
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Engage in legal reasoning, generate arguments, extract citations, and summarize case statutes using AI.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-indigo-400 gap-1.5">
                <span>Open AI Chat</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            {/* Admin Management Card */}
            <Link
              to="/admin"
              className="group relative p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-108 transition-transform">
                  📋
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  Precedent Management
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Inspect database records, manage judgments, and verify citations for accurate legal discovery.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-amber-400 gap-1.5">
                <span>Manage Records</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Profile & Account Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span>👤</span>
              <span>Account Credentials & Profile</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Legal Counsel Name</div>
                <div className="text-white font-bold mt-1 text-base">{user.fullName}</div>
              </div>
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Registered Email</div>
                <div className="text-white font-medium mt-1 truncate">{user.email}</div>
              </div>
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Assigned Role</div>
                <div className="text-white font-semibold mt-1 capitalize inline-flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-amber-400' : 'bg-sky-400'}`} />
                  {user.role || 'user'}
                </div>
              </div>
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Security Token</div>
                <div className="text-emerald-400 font-mono text-xs mt-1 flex items-center gap-1">
                  <span>● Valid JWT Session Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <span>🛡️</span>
                <span>Tier & Usage</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Each AI query and deep case analysis consumes 1 legal credit.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Quota Consumed</span>
                  <span className="font-semibold text-white">0 / {user.credits ?? 25} Used</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '10%' }} />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Plan: Standard Research</span>
              <span className="text-sky-400 font-semibold">Professional</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
