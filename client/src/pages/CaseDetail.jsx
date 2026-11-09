import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Rnd } from 'react-rnd';
import NeuralMindMap from '../components/NeuralMindMap';

const API_BASE_URL = '/api/workspace';
const AI_API_URL = '/api/ai/case-chat';

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

  const [activeTab, setActiveTab] = useState('AI Understanding');
  const [caseData, setCaseData] = useState(null);
  const caseTitle = caseData?.caseTitle || 'State vs. Ahmed Khan';

  // ── Fetch Real Case Data ──
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
      .catch((err) => console.warn('Case fetch failed:', err?.message));
    return () => { alive = false; };
  }, [caseId]);

  // ── Chat State ──
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I have analyzed this case. What would you like to know?' },
  ]);
  const [aiTyping, setAiTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const chatScrollRef = useRef(null);

  // ── Fetch Chat History ──
  useEffect(() => {
    let alive = true;
    const token = getAuthToken();
    if (!token || !caseId) {
      setIsLoadingHistory(false);
      return;
    }
    setIsLoadingHistory(true);
    axios
      .get(`${AI_API_URL}/${caseId}`, { headers: authHeaders() })
      .then((response) => {
        if (!alive) return;
        const messages = response.data?.data?.messages || response.data?.messages;
        if (Array.isArray(messages) && messages.length > 0) {
          setChatHistory(messages);
        } else {
          setChatHistory([
            { role: 'ai', text: 'Hello! I have analyzed this case. What would you like to know?' },
          ]);
        }
      })
      .catch((err) => console.warn('Failed to load case chat history:', err?.message))
      .finally(() => { if (alive) setIsLoadingHistory(false); });
    return () => { alive = false; };
  }, [caseId]);

  // ── Auto Scroll Chat ──
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = chatScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
    return () => clearTimeout(timer);
  }, [chatHistory, aiTyping, isChatOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = (chatInput || '').trim();
    if (!text || aiTyping) return;

    setChatHistory((prev) => [...prev, { role: 'user', text }]);
    setChatInput('');
    setAiTyping(true);

    try {
      const response = await axios.post(
        AI_API_URL,
        { caseId, question: text },
        { headers: authHeaders() }
      );
      const answer = response.data?.data?.answer;
      setChatHistory((prev) => [
        ...prev,
        { role: 'ai', text: answer || 'The AI returned no answer.' },
      ]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: 'ai', text: 'Error connecting to AI.' }]);
    } finally {
      setAiTyping(false);
    }
  };

  // ── Data Formatting Helpers ──
  const textOf = (value) => {
    if (value == null) return '';
    if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean).join('\n');
    return String(value).trim();
  };

  const listItems = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    const asString = textOf(value);
    if (asString.includes('\n')) return asString.split('\n').map((item) => item.trim()).filter(Boolean);
    return asString ? [asString] : [];
  };

  const lawsText = () =>
    textOf(asList(caseData?.lawsApplied).join(', ')) ||
    textOf(asList(caseData?.legalLaws).join(', ')) ||
    textOf(caseData?.caseLaws) ||
    '';

  // ── Tab Content ──
  const tabContent = {
    'My Cases': { title: 'My Cases', text: caseData ? `${caseData.caseTitle} is open in your workspace.` : 'Loading...' },
    'Facts': { title: 'Facts & Timeline', text: textOf(caseData?.facts) },
    'Legal Issues': { title: 'Legal Issues', items: listItems(caseData?.legalIssues) },
    'Laws & Case Law': (() => {
      const value = caseData?.lawsApplied || caseData?.legalLaws || caseData?.caseLaws;
      if (Array.isArray(value)) return { title: 'Laws & Case Law', items: value.map((item) => String(item).trim()).filter(Boolean) };
      return { title: 'Laws & Case Law', text: textOf(value) };
    })(),
    'Precedent Comparison': { title: 'Precedent Comparison', text: textOf(caseData?.precedentComparison) },
    'Supporting/Contradicting': { title: 'Supporting/Contradicting', text: textOf(caseData?.supportingContradicting) },
    'Opposing Arguments': { title: 'Opposing Arguments', text: textOf(caseData?.opposingArguments) },
  };

  // ── Mind Map Helpers ──
  const nodeTitles = {
    facts: 'Facts & Timeline', caseLaws: 'Case Laws', precedent: 'Precedent Comparison',
    supporting: 'Supporting/Contradicting', opposing: 'Opposing Arguments', strengths: 'Strengths & Weaknesses',
  };

  const nodeValue = (key) => {
    switch (key) {
      case 'facts': return caseData?.facts;
      case 'caseLaws': return lawsText();
      case 'precedent': return caseData?.precedentComparison;
      case 'supporting': return caseData?.supportingContradicting;
      case 'opposing': return caseData?.opposingArguments;
      case 'strengths': return caseData?.strengthsWeaknesses;
      default: return null;
    }
  };

  const modalContentFor = (node) => {
    const title = nodeTitles[node.key];
    let content = textOf(nodeValue(node.key));
    if (node.key === 'summary') {
      content = caseData ? `${caseData.caseTitle} — ${textOf(caseData.summary)}` : 'Loading...';
    }
    return { key: node.key, title, content };
  };

  const active = tabContent[activeTab] || tabContent['Facts'];

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-4 flex flex-col relative">
      {/* Header & Tabs */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Active Case Context</p>
            <h1 className="text-2xl font-bold text-gray-900">{caseTitle}</h1>
          </div>
          <button onClick={() => navigate('/my-cases')} className="bg-white border border-black text-black px-4 py-1 rounded shadow-sm hover:bg-gray-100 cursor-pointer">
            Switch
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['My Cases', 'Facts', 'AI Understanding', 'Legal Issues', 'Laws & Case Law', 'Precedent Comparison', 'Supporting/Contradicting', 'Opposing Arguments'].map((tab, i) => (
            <div
              key={i}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm rounded-lg border whitespace-nowrap cursor-pointer transition ${
                activeTab === tab ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:border-black'
              }`}
            >
              {i + 1}. {tab}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {activeTab === 'AI Understanding' ? (
            <main className="h-full w-full relative">
              <NeuralMindMap caseTitle={caseTitle} caseData={caseData} getNodeContent={(key) => modalContentFor({ key })} />
            </main>
          ) : (
            <main className="h-full overflow-y-auto rounded-lg border border-gray-300 bg-white p-8 shadow-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500">Case Workspace</p>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">{active.title}</h2>
              <div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
                {active.items ? (
                  active.items.length ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-gray-700">
                      {active.items.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  ) : null
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{active.text}</p>
                )}
              </div>
            </main>
          )}
        </div>
      </div>

      {/* Floating Lawyer Bot Button */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
        onClick={() => setIsChatOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsChatOpen((prev) => !prev); }}
        aria-label="Toggle Case AI Assistant"
      >
        <img src="/lawyer.png" alt="AI Chat" className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-white" />
        <span className="text-xs font-semibold text-gray-700 bg-white px-3 py-1 rounded-full mt-1 shadow-md border border-gray-200 select-none">
          Lawyer Bot
        </span>
      </div>

      {/* Draggable Chat Widget */}
      {isChatOpen && (
        <div className="fixed bottom-28 right-6 z-50 pointer-events-none w-[380px] h-[500px]">
          <Rnd
            default={{ x: 0, y: 0, width: 380, height: 500 }}
            minWidth={300}
            minHeight={360}
            dragHandleClassName="chat-drag-handle"
            enableResizing={{ top: false, right: false, bottom: false, left: false, topRight: false, bottomRight: true, bottomLeft: false, topLeft: false }}
            className="pointer-events-auto shadow-2xl rounded-xl overflow-hidden border border-gray-300 bg-white"
          >
            <div className="w-full h-full flex flex-col overflow-hidden bg-white">
              {/* Header */}
              <div className="shrink-0 chat-drag-handle cursor-move bg-black text-white px-4 py-3 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <div>
                    <h2 className="font-bold text-sm leading-tight text-white">Case AI Assistant</h2>
                    <p className="text-[11px] text-gray-300">Drag to move • Resize from ↘</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded text-gray-300 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                  aria-label="Close Chat"
                >
                  ✕
                </button>
              </div>

              {/* Chat History */}
              <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10 space-y-2">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-medium">Loading chat history...</p>
                  </div>
                ) : (
                  <>
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                          msg.role === 'user' ? 'bg-black text-white' : 'bg-white text-black border border-gray-200 shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {aiTyping && (
                      <div className="flex justify-start">
                        <div className="rounded-lg bg-white px-3 py-2 text-sm text-gray-500 border border-gray-200 shadow-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"></span>
                          <span>AI is thinking...</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="shrink-0 p-3 bg-white border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
                />
                <button
                  type="submit"
                  disabled={aiTyping || !chatInput.trim()}
                  className="bg-black text-white px-4 py-2 text-sm rounded hover:bg-gray-800 disabled:opacity-50 transition cursor-pointer"
                >
                  Send
                </button>
              </form>

              {/* Resize Indicator */}
              <div className="absolute bottom-1 right-1 pointer-events-none text-gray-400 select-none">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </Rnd>
        </div>
      )}
    </div>
  );
}