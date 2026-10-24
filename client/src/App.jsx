import React from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import Search from './pages/Search';
import AdminCases from './pages/AdminCases';
import AIChat from './pages/AIChat';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

function navLinkClass({ isActive }) {
  return `px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
    isActive
      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
  }`;
}

function NavigationBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="h-14 bg-slate-950 border-b border-slate-800 px-3 md:px-8 flex items-center justify-between z-20 flex-shrink-0">
      <Link to="/" className="flex items-center gap-2.5">
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
      <div className="flex items-center gap-1.5 sm:gap-2">
        <NavLink to="/" end className={navLinkClass}>
          <span>🔍</span>
          <span className="hidden sm:inline">Legal Search</span>
          <span className="sm:hidden">Search</span>
        </NavLink>

        <NavLink to="/ai-chat" className={navLinkClass}>
          <span>🤖</span>
          <span className="hidden sm:inline">AI Legal Chat</span>
          <span className="sm:hidden">AI Chat</span>
        </NavLink>

        <NavLink to="/admin" className={navLinkClass}>
          <span>📋</span>
          <span className="hidden sm:inline">Admin Cases</span>
          <span className="sm:hidden">Admin</span>
        </NavLink>

        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard" className={navLinkClass}>
              <span>⚡</span>
              <span className="hidden sm:inline">Dashboard</span>
              <span className="text-amber-400 font-mono text-xs ml-0.5">({user?.credits ?? 0})</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-all flex items-center gap-1"
              title="Sign Out"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={navLinkClass}>
              <span>🔑</span>
              <span>Sign In</span>
            </NavLink>
            <NavLink
              to="/register"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all flex items-center gap-1"
            >
              <span>✨</span>
              <span className="hidden sm:inline">Register</span>
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
          {/* Top Global Navigation Bar */}
          <NavigationBar />

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
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
