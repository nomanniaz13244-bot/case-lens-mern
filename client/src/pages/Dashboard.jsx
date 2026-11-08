import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="flex flex-1 items-center justify-center bg-[#F5F5F5] text-[#1A1A1A]">Loading...</div>;

  const handleLogout = () => { logout(); navigate('/login'); };
  const cards = [
    { to: '/', title: 'Legal Case Search', text: 'Search judgments and legal precedents across the case repository.', icon: '⌕' },
    { to: '/ai-chat', title: 'AI Legal Assistant', text: 'Analyze statutes, precedents and legal questions with the AI assistant.', icon: 'AI' },
    { to: '/workspace', title: 'Case Workspace', text: 'Create a case and explore its evidence, laws and supporting authorities.', icon: '+' },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#F5F5F5] text-[#1A1A1A] p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#000000]">Active Legal Session</p>
              <h1 className="text-3xl font-bold text-[#1A1A1A]">Welcome, {user?.fullName || 'Counsel'}!</h1>
              <p className="mt-2 max-w-xl text-sm text-gray-600">Your Case Lens AI command center for case research, analysis, drafting and workspace management.</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-[#F5F5F5] p-4">
              <div><p className="text-xs text-gray-600">Available Credits</p><p className="text-2xl font-bold text-[#000000]">{user?.credits ?? 25}</p></div>
              <button onClick={handleLogout} className="rounded-lg bg-[#000000] px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">Logout</button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold">Quick Workspaces</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {cards.map((card) => (
              <Link key={card.to} to={card.to} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-[#000000]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-[#F5F5F5] text-sm font-bold text-[#000000]">{card.icon}</div>
                <h3 className="font-bold text-[#1A1A1A]">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.text}</p>
                <span className="mt-5 block text-xs font-bold text-[#000000]">Open workspace &rarr;</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
            <h3 className="mb-4 font-bold">Account Profile</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-[#F5F5F5] p-4"><p className="text-xs text-gray-600">Legal Counsel</p><p className="mt-1 font-semibold">{user?.fullName || 'User'}</p></div>
              <div className="rounded-xl border border-gray-200 bg-[#F5F5F5] p-4"><p className="text-xs text-gray-600">Registered Email</p><p className="mt-1 font-medium">{user?.email || 'Not available'}</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="font-bold">Account Status</h3>
            <p className="mt-3 text-sm text-gray-600">Role: <span className="font-semibold text-[#1A1A1A]">{user?.role || 'User'}</span></p>
            <p className="mt-2 text-sm text-gray-600">Workspace: <span className="font-semibold text-[#000000]">Active</span></p>
          </div>
        </section>
      </div>
    </main>
  );
}
