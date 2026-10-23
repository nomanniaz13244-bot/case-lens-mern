import React, { useState, useEffect } from 'react';
import AdminCases from './pages/AdminCases';
import AIChat from './pages/AIChat';

function App() {
  // Read current URL path or fallback to '/'
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname || '/';
  });

  useEffect(() => {
    // Listen to browser back/forward buttons
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Route matching
  const isAIChatRoute = currentPath === '/ai-chat';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Global Navigation Bar */}
      <nav className="h-14 bg-slate-950 border-b border-slate-800 px-4 md:px-8 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-600/30">
            ⚖️
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide text-white">Case Lens AI</span>
            <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 font-normal">
              Legal Platform
            </span>
          </div>
        </div>

        {/* Route Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('/admin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              !isAIChatRoute
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <span>📋</span>
            <span>Admin Cases</span>
          </button>

          <button
            onClick={() => navigateTo('/ai-chat')}
            className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              isAIChatRoute
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <span>🤖</span>
            <span>AI Legal Chat</span>
          </button>
        </div>
      </nav>

      {/* Main Content View (Router View) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isAIChatRoute ? (
          <AIChat />
        ) : (
          <div className="flex-1 overflow-y-auto bg-slate-100 text-slate-900">
            <AdminCases />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
