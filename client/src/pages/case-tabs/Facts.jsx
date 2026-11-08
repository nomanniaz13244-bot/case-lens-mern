import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Facts() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F5F5] p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-gray-300 bg-white p-8 shadow-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Case Workspace</p>
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Facts &amp; Timeline</h1>
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
            <p className="text-sm leading-6 text-gray-700">
              FIR lodged on May 15, 2023. Forensic reports did not match the weapon. Witnesses gave
              contradictory statements across three separate hearings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/case-detail/demo_seed_case_1')}
            className="mt-6 rounded bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Back to Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
