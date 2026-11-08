import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const AI_API_URL = 'http://localhost:5000/api/ai/chat';

// Preset sample conversation topics for the sidebar
const INITIAL_CONVERSATIONS = [
  { id: '1', title: 'Pre-Arrest Bail Criteria (CrPC 498)', timestamp: 'Today' },
  { id: '2', title: 'Article 199 Writ Jurisdiction Scope', timestamp: 'Yesterday' },
  { id: '3', title: 'Specific Performance & Liquidated Damages', timestamp: '3 days ago' },
  { id: '4', title: 'Admissibility of Digital Evidence (QSO 1984)', timestamp: 'Last week' },
];

// Quick prompts for the empty/welcome state
const QUICK_PROMPTS = [
  {
    title: 'Pre-Arrest Bail Grounds',
    description: 'Summarize essential legal grounds for anticipatory bail under Section 498 Cr.P.C.',
    prompt: 'What are the essential grounds required to grant pre-arrest bail under Section 498 Cr.P.C.?',
  },
  {
    title: 'Constitutional Writ Scope',
    description: 'Analyze conditions for invoking High Court jurisdiction under Article 199.',
    prompt: 'Explain the prerequisites for filing a Constitutional Writ Petition under Article 199 when alternate remedies exist.',
  },
  {
    title: 'Breach of Commercial Contract',
    description: 'Break down damages and remedies available under the Contract Act 1872.',
    prompt: 'What remedies and damages are available for an unliquidated breach of commercial agreement under Contract Act 1872?',
  },
  {
    title: 'Statutory Interpretation',
    description: 'Explain the Golden Rule vs Literal Rule in recent judicial precedents.',
    prompt: 'How has the Supreme Court applied the Golden Rule of statutory interpretation in recent constitutional cases?',
  },
];

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello Counselor! I am **Case Lens AI**, your intelligent legal research and case analysis assistant.

I can help you:
- Search judicial precedents and landmark citations.
- Draft legal arguments and formulate case strategies.
- Summarize lengthy court judgments and extract statutory provisions.

How can I assist your legal matter today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeChatId, setActiveChatId] = useState('1');
  const [chatHistory, setChatHistory] = useState(INITIAL_CONVERSATIONS);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Au to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const trimmed = inputPrompt.trim();
    if (!trimmed || isTyping) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp,
    };

    // Append user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsTyping(true);

    try {
      const res = await axios.post(
        AI_API_URL,
        { message: trimmed, question: trimmed },
        { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
      );

      const payload = res.data?.data ?? res.data ?? {};
      const responseText =
        payload.answer ||
        payload.response ||
        payload.reply ||
        payload.message ||
        (typeof payload === 'string' ? payload : '');
      const citedCases =
        payload.citedCases || payload.citations || payload.cases || [];

      if (!responseText) {
        throw new Error('The AI service returned an empty response.');
      }

      const assistantMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        citedCases: Array.isArray(citedCases) ? citedCases : [],
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const detail =
        err.response?.data?.message ||
        err.message ||
        'Unable to reach the AI service.';

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          text: `I could not complete that request. ${detail} Please ensure the AI backend is running on port 5000 and try again.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    const newChatId = String(Date.now());
    const newChatTitle = 'New Legal Inquiry';
    setChatHistory((prev) => [{ id: newChatId, title: newChatTitle, timestamp: 'Just now' }, ...prev]);
    setActiveChatId(newChatId);
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        text: `New legal consultation session started. 

How can Case Lens AI assist you with case precedents, legal research, or drafting today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans overflow-hidden">
      {/* ─── Main Chat Interface ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full bg-[#F5F5F5] relative">
        {/* Top Navbar */}
        <header className="h-14 border-b border-gray-200 bg-white px-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <h1 className="font-semibold text-[#1A1A1A] text-sm md:text-base">AI Legal Assistant</h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200 bg-[#F5F5F5] text-[#000000]">
                GPT-4 Legal Core v1.1
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="text-xs px-3 py-1.5 rounded-lg bg-white text-gray-700 hover:text-[#1A1A1A] transition font-medium border border-gray-300"
            >
              ⚖️ Case Repository
            </a>
            <button
              onClick={() => {
                setMessages([
                  {
                    id: `cleared-${Date.now()}`,
                    sender: 'assistant',
                    text: 'Chat cleared. How can I help with your next legal research query?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-[#1A1A1A] transition"
              title="Clear Conversation"
            >
              Clear
            </button>
          </div>
        </header>

        {/* Scrollable Message History Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {/* Quick Prompt Cards if only initial greeting exists */}
          {messages.length === 1 && (
            <div className="max-w-3xl mx-auto my-6">
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl border border-gray-200 bg-white text-3xl mb-3">
                  ⚖️
                </div>
                <h3 className="text-lg md:text-xl font-bold text-[#1A1A1A]">AI Legal Intelligence Platform</h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  Select a research template below or type your legal question directly
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {QUICK_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputPrompt(item.prompt);
                      inputRef.current?.focus();
                    }}
                    className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-[#000000] text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="font-semibold text-xs md:text-sm text-[#1A1A1A] flex items-center justify-between">
                      <span>{item.title}</span>
                      <span className="text-[#000000] text-xs">→</span>
                    </div>
                    <div className="text-[11px] md:text-xs text-gray-600 mt-1 line-clamp-2">
                      {item.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Messages */}
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Assistant Avatar */}
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-[#000000] flex items-center justify-center text-white text-sm flex-shrink-0 shadow-sm mt-1">
                    ⚖️
                  </div>
                )}

                {/* Message Content Bubble */}
                <div
                  className={`max-w-[85%] md:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#000000] text-white rounded-br-none shadow-md '
                      : msg.isError
                        ? '  border  rounded-bl-none shadow-sm'
                        : 'bg-white text-[#1A1A1A] border border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Sender Header for Assistant */}
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-200">
                      <span className="font-semibold text-xs text-[#000000]">Case Lens AI Assistant</span>
                      <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                    </div>
                  )}

                  {/* Message Body with clean paragraph/markdown support */}
                  <div className="whitespace-pre-wrap space-y-2">
                    {msg.text}
                  </div>

                  {/* Cited Cases for Assistant Messages */}
                  {msg.sender === 'assistant' &&
                    Array.isArray(msg.citedCases) &&
                    msg.citedCases.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-300/50">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#1A1A1A]">
                          Cited Cases
                        </p>
                        <div className="space-y-2">
                          {msg.citedCases.map((cited, idx) => {
                            const isString = typeof cited === 'string';
                            const title = isString
                              ? cited
                              : cited.caseTitle || cited.title || cited.name || 'Legal Authority';
                            const citation = isString ? '' : cited.citation;
                            const court = isString ? '' : cited.courtName || cited.court;
                            const summary = isString ? '' : cited.summary;

                            return (
                              <div
                                key={cited._id || `${msg.id}-cite-${idx}`}
                                className="rounded-lg border border-gray-200 bg-[#F5F5F5] px-3 py-2"
                              >
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                  <span className="text-xs font-semibold text-white">
                                    {title}
                                  </span>
                                  {citation && (
                                    <span className="font-mono text-[10px] font-semibold text-[#1A1A1A]">
                                      {citation}
                                    </span>
                                  )}
                                </div>
                                {court && (
                                  <p className="mt-0.5 text-[10px] text-gray-500">{court}</p>
                                )}
                                {summary && (
                                  <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-gray-600">
                                    {summary}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Actions Bar for Assistant Messages */}
                  {msg.sender === 'assistant' && (
                    <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                      <span className="text-[10px] text-gray-500">CaseLens Legal Engine</span>
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="text-[#1A1A1A] transition flex items-center gap-1 text-[11px]"
                      >
                        {copiedId === msg.id ? '✓ Copied' : '📋 Copy analysis'}
                      </button>
                    </div>
                  )}

                  {/* Timestamp for User */}
                  {msg.sender === 'user' && (
                    <div className="text-[10px] text-white text-right mt-1.5">
                      {msg.timestamp}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl border border-gray-300 bg-white flex items-center justify-center text-[#1A1A1A] text-xs font-semibold flex-shrink-0 mt-1">
                    You
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3.5 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-[#000000] flex items-center justify-center text-white text-sm flex-shrink-0 shadow-sm">
                  ⚖️
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                  <span className="text-xs text-gray-600 font-medium">
                    Analyzing legal corpus...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ─── Bottom Floating Input Box (ChatGPT-style) ──────────────────────── */}
        <div className="border-t border-gray-200 bg-white p-3 md:p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-white border border-gray-300 focus-within:border-[#000000] rounded-2xl shadow-sm transition-all">
              <textarea
                ref={inputRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows="1"
                placeholder="Ask legal questions, cite case facts, or request statutory research..."
                className="w-full bg-transparent text-[#1A1A1A] placeholder-gray-400 px-4 py-3.5 pr-14 text-sm outline-none resize-none min-h-[48px] max-h-36"
                style={{ scrollbarWidth: 'none' }}
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!inputPrompt.trim() || isTyping}
                className={`absolute right-2.5 p-2 rounded-xl flex items-center justify-center transition-all ${
                  inputPrompt.trim() && !isTyping
                    ? 'bg-[#000000] text-white shadow-sm'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                title="Send Message (Enter)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            </div>

            {/* Disclaimer Subtitle */}
            <p className="text-[11px] text-center text-gray-400 mt-2">
              Case Lens AI Assistant is designed for legal research support. Please verify citations against official law reporters (PLD, SCMR, CLC).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
