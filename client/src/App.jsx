import React from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import Search from './pages/Search';
import AdminCases from './pages/AdminCases';
import AIChat from './pages/AIChat';

function navLinkClass({ isActive }) {
  return `px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
    isActive
      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
  }`;
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
        {/* Top Global Navigation Bar */}
        <nav className="h-14 bg-slate-950 border-b border-slate-800 px-4 md:px-8 flex items-center justify-between z-20 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-600/30">
              ⚖️
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">Case Lens AI</span>
              <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 font-normal">
                Legal Platform
              </span>
            </div>
          </Link>

          {/* Route Navigation Tabs */}
          <div className="flex items-center gap-2">
            <NavLink to="/" end className={navLinkClass}>
              <span>🔍</span>
              <span>Legal Search</span>
            </NavLink>

            <NavLink to="/admin" className={navLinkClass}>
              <span>📋</span>
              <span>Admin Cases</span>
            </NavLink>

            <NavLink to="/ai-chat" className={navLinkClass}>
              <span>🤖</span>
              <span>AI Legal Chat</span>
            </NavLink>
          </div>
        </nav>

        {/* Main Content View (Router View) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route
              path="/"
              element={
                <div className="flex-1 overflow-y-auto">
                  <Search />
                </div>
              }
            />
            <Route
              path="/admin"
              element={
                <div className="flex-1 overflow-y-auto bg-slate-100 text-slate-900">
                  <AdminCases />
                </div>
              }
            />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
