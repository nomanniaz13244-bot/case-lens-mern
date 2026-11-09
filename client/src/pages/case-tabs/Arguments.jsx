import React from 'react';
import { Link } from 'react-router-dom';
import useCaseData, { orUnavailable } from './useCaseData';

export default function Arguments() {
  const { caseId, caseData, loading } = useCaseData();
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F5F5] p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-gray-300 bg-white p-8 shadow-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Case Workspace</p>
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Opposing Arguments</h1>
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
            <p className="whitespace-pre-line text-sm leading-6 text-gray-700">
              {loading
                ? 'Loading opposing arguments from the database…'
                : orUnavailable('Opposing arguments', caseData?.opposingArguments)}
            </p>
          </div>
          <Link
            to={`/case-detail/${caseId}`}
            className="mt-6 inline-block rounded bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Back to Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
