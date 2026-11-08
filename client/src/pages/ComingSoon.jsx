import React from 'react';
import { useLocation } from 'react-router-dom';

const titles = {
  '/research': 'Legal Research',
  '/laws': 'Case Laws',
  '/analysis': 'Judgment Analysis',
  '/opposition': 'Opposition & Weakness',
  '/drafting': 'Legal Drafting',
  '/dictionary': 'Legal Dictionary',
};

export default function ComingSoon() {
  const { pathname } = useLocation();
  const title = titles[pathname] || 'Feature';

  return (
    <main className="min-h-[calc(100vh-4rem)] flex-1 bg-[#F5F5F5] px-6 py-10 text-gray-900 sm:px-10">
      <div className="mx-auto flex min-h-[420px] max-w-5xl flex-col items-center justify-center rounded-3xl border border-[#d1d5db] bg-white text-center shadow-sm">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl text-white">⚖</div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] bg-white">Case Lens Legal Suite</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mt-3 text-sm text-gray-700">This workspace is being prepared and will be available soon.</p>
        <span className="mt-6 rounded-full bg-white px-4 py-2 text-xs font-bold bg-white ring-1 ring-gray-300">Coming Soon</span>
      </div>
    </main>
  );
}
