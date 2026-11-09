import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CREATE_AI_URL = '/api/workspace/create';

export default function CaseWorkspace() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const [inputType, setInputType] = useState('text');
  const [caseTitle, setCaseTitle] = useState('');
  const [text, setText] = useState('');
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ title: '', description: '' });

  const switchInput = (type) => {
    setInputType(type);
    setError('');
    setFieldErrors({ title: '', description: '' });
    if (type === 'text') {
      setDocument(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setText('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const titleMissing = !caseTitle.trim();
    const descriptionMissing = inputType === 'text' && !text.trim();
    const documentMissing = inputType === 'document' && !document;

    if (titleMissing || descriptionMissing || documentMissing) {
      setFieldErrors({
        title: titleMissing ? 'Title is required' : '',
        description: descriptionMissing ? 'Case description is required' : '',
      });
      return;
    }

    const payload = new FormData();
    payload.append('caseTitle', caseTitle.trim());
    if (inputType === 'text') {
      // `caseText` is the new contract; `text` kept for API compatibility.
      payload.append('caseText', text.trim());
      payload.append('text', text.trim());
    } else {
      payload.append('file', document);
    }

    const authToken =
      token ||
      localStorage.getItem('case_lens_token') ||
      localStorage.getItem('token');
    if (!authToken) {
      setError('Please log in to create a case workspace.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(CREATE_AI_URL, payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Unable to create the case.');
      }
      const caseId = response.data?.caseId || response.data?.data?._id;
      if (!caseId) throw new Error('The case was created but no case ID was returned.');
      navigate('/case-detail/' + caseId);
    } catch (requestError) {
      const status = requestError.response?.status;
      const apiMessage = requestError.response?.data?.message || requestError.message;
      if (status === 401 || /token|authorized|jwt/i.test(String(apiMessage))) {
        setError('Your session could not be verified. Please log in again and retry.');
      } else {
        setError(apiMessage || 'Unable to analyze the case.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex-1 overflow-y-auto bg-[#F5F5F5] px-4 py-10 text-[#1A1A1A] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#000000]">AI Legal Analysis</p>
          <h1 className="text-3xl font-bold text-[#1A1A1A] sm:text-4xl">Case Workspace</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            Add a judgment as text or upload a document. Case Lens will extract the facts, issues, laws, verdict, and related cases.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <fieldset>
            <legend className="mb-4 text-sm font-semibold text-[#1A1A1A]">Choose case input</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-2xl border border-gray-300 p-4 transition ${inputType === 'text' ? 'bg-[#000000] text-white' : 'bg-white text-[#1A1A1A] hover:border-[#000000]'}`}>
                <input className="sr-only" type="radio" name="inputType" checked={inputType === 'text'} onChange={() => switchInput('text')} />
                              <span className="block font-semibold">Manual Text</span>
                              <span className={`mt-1 block text-xs ${inputType === 'text' ? 'text-white/70' : 'text-gray-700'}`}>Paste judgment text or case facts</span>
              </label>
                            <label className={`cursor-pointer rounded-2xl border border-gray-300 p-4 transition ${inputType === 'document' ? 'bg-[#000000] text-white' : 'bg-white text-[#1A1A1A] hover:border-[#000000]'}`}>
                <input className="sr-only" type="radio" name="inputType" checked={inputType === 'document'} onChange={() => switchInput('document')} />
                              <span className="block font-semibold">Upload Document</span>
                <span className={`mt-1 block text-xs ${inputType === 'document' ? 'text-white/70' : 'text-gray-700'}`}>PDF, image, or text file</span>
              </label>
            </div>
          </fieldset>

          {/* ── Section 1: Case Title ─────────────────────────────────────── */}
          <div>
            <label htmlFor="workspace-case-title" className="mb-2 block text-sm font-semibold text-[#1A1A1A]">
              Case Title
            </label>
            <input
              id="workspace-case-title"
              type="text"
              value={caseTitle}
              onChange={(event) => {
                setCaseTitle(event.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((current) => ({ ...current, title: '' }));
                }
              }}
              placeholder="State vs. Imran"
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-[#1A1A1A] outline-none placeholder:text-gray-400 focus:border-[#000000] focus:ring-1 focus:ring-[#000000] ${
                fieldErrors.title ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {fieldErrors.title && (
              <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          <div className="mt-7">
            {inputType === 'text' ? (
              <div>
                <label htmlFor="workspace-case-text" className="mb-2 block text-sm font-semibold text-[#1A1A1A]">Case Description / Facts</label>
                <textarea
                  id="workspace-case-text"
                  rows={12}
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    if (fieldErrors.description) {
                      setFieldErrors((current) => ({ ...current, description: '' }));
                    }
                  }}
                  placeholder="Paste the full case details, FIR text, or judgment here…"
                  className={`w-full resize-y rounded-2xl border bg-white px-4 py-3 text-sm leading-6 text-[#1A1A1A] outline-none placeholder:text-gray-400 focus:border-[#000000] focus:ring-1 focus:ring-[#000000] ${
                    fieldErrors.description ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.description && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors.description}</p>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="workspace-case-document" className="mb-2 block text-sm font-semibold text-[#1A1A1A]">Case document</label>
                <input ref={fileInputRef} id="workspace-case-document" type="file" accept=".pdf,image/*,.txt" onChange={(event) => setDocument(event.target.files?.[0] || null)} className="block w-full rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8 text-sm text-gray-900 file:mr-4 file:rounded-lg file:border file:border-black file:border-black file:bg-white file:px-4 file:py-2 file:font-semibold file:text-black" />
              </div>
            )}
          </div>

          {error && <div className="mt-5 rounded-xl border border-gray-300 bg-[#F5F5F5] px-4 py-3 text-sm text-black">{error}</div>}

          <button
            type="submit"
            disabled={loading || !caseTitle.trim() || (inputType === 'text' ? !text.trim() : !document)}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-[#000000] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />}
            {loading ? 'Analyzing case…' : 'Create Case Workspace'}
          </button>
        </form>
      </div>
    </main>
  );
}
