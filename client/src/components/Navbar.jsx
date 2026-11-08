import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="h-16 flex-shrink-0 border-b border-[#E5E5E5] bg-white px-4 md:px-7 flex items-center justify-between z-40">
      <Link to="/" className="flex items-center gap-3 text-black">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">CL</span>
        <div>
          <span className="block text-sm font-bold tracking-wide">Case Lens AI</span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-gray-500">Legal Intelligence</span>
        </div>
      </Link>

      {isAuthenticated && (
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden rounded-xl border border-[#E5E5E5] bg-white px-3 py-2 text-sm sm:block">
            <span className="text-gray-500">User </span>
            <span className="font-semibold text-black">{user?.fullName || user?.name || 'User'}</span>
          </div>
          <div className="rounded-xl bg-black px-3 py-2 text-xs font-bold text-white">
            <span className="hidden sm:inline">Credits: </span>{user?.credits ?? 0}
          </div>
          <button type="button" className="relative rounded-xl border border-[#E5E5E5] bg-white p-2.5 text-black hover:bg-[#F5F5F5]" aria-label="Notifications">
            <span aria-hidden="true">Bell</span>
            <span className="hidden" />
          </button>
          <button type="button" onClick={handleLogout} className="rounded-xl bg-black px-3 py-2 text-xs font-bold text-white hover:bg-gray-800">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
