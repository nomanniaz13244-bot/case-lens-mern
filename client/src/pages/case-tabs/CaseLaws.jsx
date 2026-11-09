import React from 'react';
import { Link } from 'react-router-dom';
import useCaseData, { asText, orUnavailable } from './useCaseData';

export default function CaseLaws() {
  const { caseId, caseData, loading } = useCaseData();
  const laws = Array.isArray(caseData?.legalLaws) ? caseData.legalLaws.filter(Boolean) : [];
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F5F5] p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-gray-300 bg-white p-8 shadow-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Case Workspace</p>
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Laws &amp; Case Law</h1>
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
            {laws.length ? (
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700">
                {laws.map((law, index) => (
                  <li key={index}>{asText(law)}</li>
                ))}
              </ul>
            ) : (
              <p className="whitespace-pre-line text-sm leading-6 text-gray-700">
                {loading ? 'Loading laws from the database…' : orUnavailable('Legal laws / case laws', caseData?.caseLaws)}
              </p>
            )}
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
