import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  // ✅ FIX: Check localStorage directly first. If a token is stored we can render
  // immediately without waiting for the context useEffect to settle. This prevents
  // the "Loading session…" flash that was kicking users back to /login on every
  // module navigation or hard refresh.
  const storedToken =
    token ||
    localStorage.getItem('case_lens_token') ||
    localStorage.getItem('token');

  // If we already have a token, render the page immediately — no spinner needed.
  if (storedToken) {
    return children;
  }

  // No token in storage. Wait for the context to finish initialising before
  // deciding to redirect, in case the token is being set asynchronously.
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F5F5F5] text-[#1A1A1A]">
        Loading session...
      </div>
    );
  }

  // Context is settled and there is still no token — redirect to login.
  return <Navigate to="/login" replace state={{ from: location }} />;
}

export default ProtectedRoute;
