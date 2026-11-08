import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api/workspace';
// Backend "simple case chat": one DB read + one Groq call, no RAG.
const AI_API_URL = '/api/ai/simple-case-chat';

const getAuthToken = () =>
  localStorage.getItem('case_lens_token') || localStorage.getItem('token');

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const asList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
};

export default function CaseDetail() {
  const navigate = useNavigate();
  const { caseId } = useParams();

  // Active workspace tab (default keeps the Mind Map visible on arrival).
  const [activeTab, setActiveTab] = useState('AI Understanding');
  // Pop-up state for the 6 mind-map boxes.
  const [modalData, setModalData] = useState(null);

  // ── Real case data — fetched from the in-memory MongoDB via the backend ──
  const [caseData, setCaseData] = useState(null);
  const caseTitle = caseData?.caseTitle || 'State vs. Ahmed Khan';

  useEffect(() => {
    let alive = true;
    const token = getAuthToken();
    if (!token || !caseId) return;
    axios
      .get(`${API_BASE_URL}/case/${caseId}`, { headers: authHeaders() })
      .then((response) => {
        if (alive && response.data?.success && response.data?.data) {
          setCaseData(response.data.data);
        }
      })
      .catch((err) => console.warn('Case fetch failed — keeping fallback data:', err?.message));
    return () => { alive = false; };
  }, [caseId]);

  // ── Chat state: controlled input + message history (dummy AI, no backend) ──
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I have analyzed this case. What would you like to know?' },
  ]);
  const [aiTyping, setAiTyping] = useState(false);
  const chatScrollRef = useRef(null);

  // Auto-scroll the chat to the latest message whenever history/typing changes.
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatHistory, aiTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = (chatInput || '').trim();
    if (!text) return; // ignore empty input
    if (aiTyping) return; // one request at a time

    // Append the user's message and clear the input immediately.
    setChatHistory((prev) => [...prev, { role: 'user', text }]);
    setChatInput('');
    setAiTyping(true);

    try {
      // Backend "simple case chat" — backend fetches the case, calls Groq.
      // No direct browser → Groq request, so no CORS issues.
      const response = await axios.post(
        AI_API_URL,
        { caseId, question: text },
        { headers: authHeaders() }
      );
      const answer = response.data?.data?.answer;
      setChatHistory((prev) => [
        ...prev,
        { role: 'ai', text: answer || 'The AI returned no answer for this question.' },
      ]);
    } catch (err) {
      console.warn('AI chat error:', err?.response?.data?.message || err?.message);
      setChatHistory((prev) => [...prev, { role: 'ai', text: 'Error connecting to AI.' }]);
    } finally {
      setAiTyping(false);
    }
  };

  // ── Center-panel mock content per tab (no API, no libraries) ──
  const tabContent = {
    'My Cases': {
      title: 'My Cases',
      text: 'State vs. Ahmed Khan and one other matter are currently open in your workspace. Open a case to continue its analysis. (Demo data)',
    },
    'Facts': {
      title: 'Facts & Timeline',
      text: 'FIR lodged on May 15, 2023. Forensic reports did not match the weapon. Witnesses gave contradictory statements across three separate hearings. (Demo data)',
    },
    'Legal Issues': {
      title: 'Legal Issues',
      text: '1. Whether the forensic mismatch undermines the recovery evidence.\n2. Whether contradictory witness statements weaken the prosecution case.\n3. Whether the delayed trial justifies bail under Section 497 CrPC. (Demo data)',
    },
    'Laws & Case Law': {
      title: 'Laws & Case Law',
      text: 'Section 497 CrPC governs bail in the Special Court; Article 10-A guarantees a fair trial within a reasonable time. Both provisions anchor the release order. (Demo data)',
    },
    'Precedent Comparison': {
      title: 'Precedent Comparison',
      text: 'Similar bail cases show weak evidence leads to bail. This record mirrors the matched precedents where forensic inconsistency outweighed the recovery argument. (Demo data)',
    },
    'Supporting/Contradicting': {
      title: 'Supporting/Contradicting',
      text: 'Supporting: unmatched forensic report and witness contradictions favor the accused. Contradicting: the alleged weapon was recovered from the accused’s residence. (Demo data)',
    },
    'Opposing Arguments': {
      title: 'Opposing Arguments',
      text: 'Prosecution argued the severity of the crime and the risk of evidence tampering, maintaining that witness contradictions were memory lapses rather than fabrication. (Demo data)',
    },
  };

  // ── Pop-up content for the 6 mind-map nodes ──
  const mockData = {
    summary: { key: 'summary', title: 'Case Title & Summary', content: 'State vs. Ahmed Khan — The Supreme Court upheld the bail granted to the accused due to weak evidence and delayed trial.' },
    facts: { key: 'facts', title: 'Facts & Timeline', content: 'FIR lodged on May 15, 2023. Forensic reports did not match the weapon. Witnesses gave contradictory statements across three separate hearings.' },
    caseLaws: { key: 'caseLaws', title: 'Case Laws', content: 'Section 497 CrPC governs bail in the Special Court; Article 10-A guarantees a fair trial within a reasonable time. Both provisions anchor the release order.' },
    precedent: { key: 'precedent', title: 'Precedent Comparison', content: 'Similar bail cases show weak evidence leads to bail. This record mirrors the matched precedents where forensic inconsistency outweighed the recovery argument.' },
    supporting: { key: 'supporting', title: 'Supporting/Contradicting', content: 'Supporting: unmatched forensic report and witness contradictions favor the accused. Contradicting: the alleged weapon was recovered from the accused’s residence.' },
    opposing: { key: 'opposing', title: 'Opposing Arguments', content: 'Prosecution argued the severity of the crime and the risk of evidence tampering, maintaining that witness contradictions were memory lapses rather than fabrication.' },
    strengths: { key: 'strengths', title: 'Strengths & Weaknesses', content: 'Strengths: contradictory statements from key witnesses and the forensic mismatch. Weaknesses: no independent character witnesses on file for the accused.' },
  };

  // ── Pop-up content for the 6 mind-map nodes (real data → mock fallback) ──
  const modalContentFor = (node) => {
    const fallback = mockData[node.key];
    switch (node.key) {
      case 'summary':
        return { ...fallback, content: caseData ? `${caseData.caseTitle} — ${caseData.summary || 'No summary available.'}` : fallback.content };
      case 'facts':
        return { ...fallback, content: caseData?.facts || fallback.content };
      case 'caseLaws':
        return { ...fallback, content: (asList(caseData?.legalLaws).join('; ') || caseData?.caseLaws) ? (asList(caseData?.legalLaws).join('; ') || caseData?.caseLaws) : fallback.content };
      case 'precedent':
        return { ...fallback, content: caseData?.precedentComparison || caseData?.precedenceComparison || fallback.content };
      case 'supporting':
        return { ...fallback, content: caseData?.supportingContradicting || fallback.content };
      case 'opposing':
        return { ...fallback, content: caseData?.opposingArguments || fallback.content };
      case 'strengths':
        return { ...fallback, content: caseData?.strengthsWeaknesses || fallback.content };
      default:
        return fallback;
    }
  };

  // The 6 surrounding nodes: label, data key, position styling.
  const nodes = [
    { key: 'facts', label: 'Facts & Timeline', pos: 'top-[15%] left-[15%]' },
    { key: 'caseLaws', label: 'Case Laws', pos: 'top-[15%] right-[15%]' },
    { key: 'precedent', label: 'Precedent Comparison', pos: 'top-[45%] left-[5%]' },
    { key: 'supporting', label: 'Supporting/Contradicting', pos: 'top-[45%] right-[5%]' },
    { key: 'opposing', label: 'Opposing Arguments', pos: 'bottom-[15%] left-[15%]' },
    { key: 'strengths', label: 'Strengths & Weaknesses', pos: 'bottom-[15%] right-[15%]' },
  ];

  const activeKey = modalData?.key || null;

  const activeBoxCls = (key) =>
    activeKey === key
      ? 'border-blue-500 shadow-[0_0_18px_rgba(59,130,246,0.55)] scale-105'
      : 'border-gray-400 shadow-lg hover:border-black hover:shadow-xl';

  const active = tabContent[activeTab] || tabContent['Facts'];

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-4 flex flex-col">
      {/* Modal entrance animation (pure CSS) */}
      <style>{`
        @keyframes modalFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.92) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .modal-overlay { animation: modalFade 0.2s ease-out; }
        .modal-box { animation: modalPop 0.22s ease-out; }
        @keyframes panelFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .panel-swap { animation: panelFade 0.25s ease-out; }
      `}</style>

      {/* ── Header & Tabs (never unmount) ──────────────────────────────────── */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Active Case Context</p>
            <h1 className="text-2xl font-bold text-gray-900">{caseTitle}</h1>
          </div>
          <button onClick={() => navigate('/my-cases')} className="bg-white border border-black text-black px-4 py-1 rounded shadow-sm hover:bg-gray-100">
            Switch
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['My Cases', 'Facts', 'AI Understanding', 'Legal Issues', 'Laws & Case Law', 'Precedent Comparison', 'Supporting/Contradicting', 'Opposing Arguments'].map((tab, i) => (
            <div
              key={i}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm rounded-lg border whitespace-nowrap cursor-pointer transition ${
                activeTab === tab
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-black'
              }`}
            >
              {i + 1}. {tab}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Workspace: 2-column — center content + fixed AI chat ───────── */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        
        {/* CENTER: swaps per tab; header/tabs/chat stay mounted */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'AI Understanding' ? (
            /* Exact Dark Blue Mind Map */
            <main className="panel-swap h-full bg-[#0B1120] rounded-lg shadow-lg relative overflow-hidden flex items-center justify-center p-8">
              
              {/* SVG Connecting Lines — active node's line thickens */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1="50%" y1="50%" x2="25%" y2="20%" stroke="#3B82F6" strokeWidth={activeKey === 'facts' ? 3 : 2} strokeDasharray="5,5" />
                <line x1="50%" y1="50%" x2="75%" y2="20%" stroke="#3B82F6" strokeWidth={activeKey === 'caseLaws' ? 3 : 2} strokeDasharray="5,5" />
                <line x1="50%" y1="50%" x2="20%" y2="50%" stroke="#3B82F6" strokeWidth={activeKey === 'precedent' ? 3 : 2} strokeDasharray="5,5" />
                <line x1="50%" y1="50%" x2="80%" y2="50%" stroke="#3B82F6" strokeWidth={activeKey === 'supporting' ? 3 : 2} strokeDasharray="5,5" />
                <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="#3B82F6" strokeWidth={activeKey === 'opposing' ? 3 : 2} strokeDasharray="5,5" />
                <line x1="50%" y1="50%" x2="75%" y2="80%" stroke="#3B82F6" strokeWidth={activeKey === 'strengths' ? 3 : 2} strokeDasharray="5,5" />
              </svg>

              {/* Center Case Title Node */}
              <div className="relative z-10 bg-black border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] text-white px-6 py-4 rounded-full text-center">
                <p className="text-xs text-gray-400 font-bold uppercase">Case Title</p>
                <h2 className="font-bold text-sm max-w-[220px]">{caseTitle}</h2>
              </div>

              {/* Surrounding Nodes — clickable, opens the pop-up modal */}
              {nodes.map((node) => (
                <button
                  key={node.key}
                  type="button"
                  onClick={() => setModalData(modalContentFor(node))}
                  className={`absolute ${node.pos} z-10 w-40 bg-white rounded-lg p-3 text-center border transition duration-200 ${activeBoxCls(node.key)}`}
                >
                  <h3 className="font-bold text-sm text-black">{node.label}</h3>
                  <p className="text-[10px] text-gray-500 mt-1">OPEN ANALYSIS</p>
                </button>
              ))}
            </main>
          ) : (
            /* Clean white page for every other tab */
            <main className="panel-swap h-full overflow-y-auto rounded-lg border border-gray-300 bg-white p-8 shadow-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Case Workspace</p>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">{active.title}</h2>
              <div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{active.text}</p>
              </div>
            </main>
          )}
        </div>

        {/* RIGHT: AI Assistant (always visible) */}
        <div className="w-[350px] shrink-0 bg-white border border-gray-300 rounded-lg shadow-md flex flex-col">
          <div className="bg-black text-white p-4 rounded-t-lg">
            <h2 className="font-bold">AI Assistant</h2>
            <p className="text-xs text-gray-300">Ask about this specific case</p>
          </div>
          
          <div ref={chatScrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {chatHistory.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-sm ${
                      isUser
                        ? 'bg-black text-white'
                        : 'bg-white text-black border border-gray-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {aiTyping && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-white px-3 py-2 text-sm text-gray-500 border border-gray-200">
                  AI is thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-300 flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question..." 
              className="flex-1 border border-gray-300 p-2 rounded focus:outline-none focus:border-black"
            />
            <button type="submit" className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
              Send
            </button>
          </form>
        </div>

      </div>

      {/* ── Pop-up Modal — shown only when modalData is set ─────────────────── */}
      {modalData && (
        <div className="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalData(null)}>
          <div
            className="modal-box bg-white rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-gray-900">{modalData.title}</h2>
              <button
                type="button"
                onClick={() => setModalData(null)}
                aria-label="Close"
                className="shrink-0 grid h-8 w-8 place-items-center rounded-lg border border-black text-sm font-bold text-black transition hover:bg-black hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-700 whitespace-pre-wrap">{modalData.content}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalData(null)}
                className="bg-black text-white px-4 py-2 rounded text-sm font-semibold transition hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
