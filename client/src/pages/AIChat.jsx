import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ChevronsRight,
  ChevronLeft,
  MessageSquare,
  MoreVertical,
  Pin,
  PinOff,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

const AI_API_URL = '/api/ai/chat';
const CHAT_HISTORY_URL = '/api/chat/history';
const CHAT_SESSION_URL = '/api/chat';

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
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // ─── Chat-history state ────────────────────────────────────────────────────
  const [sessions, setSessions] = useState([]); // { _id, title, isPinned, updatedAt }
  const [activeSessionId, setActiveSessionId] = useState(null); // null = fresh unsaved chat
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null); // 3-dots menu
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // inline delete confirmation
  const [pinnedBusyId, setPinnedBusyId] = useState(null); // pin toggle in flight
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // history sidebar expanded?

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
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

    // UX gate: an incomplete question would only produce noisy search results.
    if (trimmed.length < 3) {
      setToast('Please ask a complete question.');
      return;
    }

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
        { message: trimmed, question: trimmed, sessionId: activeSessionId },
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

      // The backend creates/reuses the session for this exchange — track it so
      // further messages land in the same history entry.
      if (payload.sessionId) {
        setActiveSessionId(payload.sessionId);
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
      fetchHistory();
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

  // Auto-dismiss the toast a few seconds after it appears.
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  // ─── Chat-history logic ─────────────────────────────────────────────────────
  const WELCOME_MESSAGES = [
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
  ];

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get(CHAT_HISTORY_URL, { timeout: 20000 });
      setSessions(response.data?.data || []);
    } catch {
      // Non-fatal: the chat works even if history fails to load.
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // Load the history once on mount.
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Close any open 3-dots menu when clicking elsewhere.
  useEffect(() => {
    if (!openMenuId) return undefined;
    const closeMenu = (event) => {
      if (event.target.closest?.('[data-session-menu]')) return;
      setOpenMenuId(null);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [openMenuId]);

  // Group sessions for the sidebar: Today / Yesterday / Previous 7 Days / Older.
  const groupSessionsByDate = useCallback((list) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const startOfWeek = new Date(startOfToday.getTime() - 7 * 86400000);

    const groups = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] };
    list.forEach((session) => {
      const date = new Date(session.updatedAt || session.createdAt);
      let bucket;
      if (date >= startOfToday) bucket = 'Today';
      else if (date >= startOfYesterday) bucket = 'Yesterday';
      else if (date >= startOfWeek) bucket = 'Previous 7 Days';
      else bucket = 'Older';
      groups[bucket].push(session);
    });
    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, []);

  const handleSelectSession = async (sessionId) => {
    setOpenMenuId(null);
    if (isTyping || sessionId === activeSessionId) return;

    try {
      const response = await axios.get(`${CHAT_SESSION_URL}/${sessionId}`, { timeout: 20000 });
      const data = response.data?.data;
      if (!data) throw new Error('Session not found.');

      const loaded = (data.messages || []).map((message, index) => ({
        id: `${data._id}-m${index}`,
        sender: message.role,
        text: message.text,
        citedCases: Array.isArray(message.citedCases) ? message.citedCases : [],
        timestamp: message.createdAt
          ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
      }));

      // Keep the conversation open even if an old session has no messages.
      setMessages(loaded.length > 0 ? loaded : WELCOME_MESSAGES);
      setActiveSessionId(data._id);
      // A fresh paint lands at the bottom of the scroll area.
      requestAnimationFrame(() => scrollToBottom('auto'));
    } catch {
      setToast('Could not load that chat. Please try again.');
    }
  };

  const handleTogglePin = async (sessionId) => {
    setOpenMenuId(null);
    if (pinnedBusyId) return;

    setPinnedBusyId(sessionId);
    try {
      await axios.patch(
        `${CHAT_SESSION_URL}/${sessionId}/pin`,
        {},
        { timeout: 20000 }
      );
      // The backend sorts pinned chats first — refetch to reflect the order.
      await fetchHistory();
      setToast('Pin status updated.');
    } catch {
      setToast('Could not update the pin status. Please try again.');
    } finally {
      setPinnedBusyId(null);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    setConfirmDeleteId(null);
    setOpenMenuId(null);

    const deletingActive = sessionId === activeSessionId;
    try {
      await axios.delete(`${CHAT_SESSION_URL}/${sessionId}`, { timeout: 20000 });
      setSessions((current) => current.filter((session) => session._id !== sessionId));
      setToast('Chat deleted.');
      if (deletingActive) {
        setActiveSessionId(null);
        setMessages(WELCOME_MESSAGES);
      }
    } catch {
      setToast('Could not delete that chat. Please try again.');
    }
  };

  const resetToastState = () => setToast(null);

  const handleNewChat = () => {
    resetToastState();
    setOpenMenuId(null);
    setActiveSessionId(null);
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
      {/* ─── LEFT: Chat History Sidebar (collapsible, ChatGPT-style) ─────────── */}
      <aside
        className={`hidden flex-shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-all duration-300 md:flex ${
          isSidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className={`p-3 ${isSidebarOpen ? 'space-y-2' : 'space-y-2'}`}>
          {/* Collapse/Expand toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label={isSidebarOpen ? 'Collapse chat history' : 'Expand chat history'}
            title={isSidebarOpen ? 'Collapse chat history' : 'Expand chat history'}
            className="flex h-9 w-full items-center justify-center rounded-lg text-gray-500 transition hover:bg-[#F5F5F5] hover:text-[#1A1A1A]"
          >
            {isSidebarOpen ? (
              <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <ChevronsRight size={20} strokeWidth={2.2} aria-hidden="true" />
            )}
          </button>

          {/* New Chat */}
          <button
            type="button"
            onClick={handleNewChat}
            disabled={isTyping}
            title="New Chat"
            className={`flex items-center justify-center rounded-xl bg-black text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50 ${
              isSidebarOpen ? 'w-full gap-2 px-4 py-3' : 'h-9 w-9'
            }`}
          >
            <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
            {isSidebarOpen && 'New Chat'}
          </button>
        </div>

        {isSidebarOpen ? (
          <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Chat history">
            {loadingSessions ? (
              <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-gray-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
                Loading history...
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-xs font-semibold text-gray-600">No conversations yet</p>
                <p className="mt-1 text-[10px] leading-relaxed text-gray-400">
                  Ask a question and the chat will be saved here automatically.
                </p>
              </div>
            ) : (
              groupSessionsByDate(sessions).map(([groupLabel, groupItems]) => (
                <div key={groupLabel} className="mb-4">
                  <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    {groupLabel}
                  </p>
                  <div className="space-y-0.5">
                    {groupItems.map((session) => {
                      const isActive = session._id === activeSessionId;
                      const isMenuOpen = openMenuId === session._id;
                      const isDeleteActive = confirmDeleteId === session._id;
                      const isPinning = pinnedBusyId === session._id;
                      return (
                        <div
                          key={session._id}
                          className={`group relative flex items-stretch gap-0 rounded-lg transition ${
                            isActive ? 'bg-gray-200' : 'hover:bg-[#F5F5F5]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectSession(session._id)}
                            className="min-w-0 flex-1 rounded-l-lg px-3 py-2.5 text-left"
                          >
                            <p
                              className={`flex min-w-0 items-center gap-1.5 text-xs font-semibold ${
                                isActive ? 'text-black' : 'text-[#1A1A1A]'
                              }`}
                              title={session.title}
                            >
                              <span className="truncate">
                                {session.title || 'New Chat'}
                              </span>
                              {session.isPinned && (
                                <Pin
                                  size={11}
                                  className="shrink-0 fill-amber-400 text-amber-500"
                                  aria-label="Pinned chat"
                                />
                              )}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] text-gray-500">
                              {new Date(session.updatedAt || session.createdAt).toLocaleDateString(
                                undefined,
                                { day: '2-digit', month: 'short' }
                              )}
                            </p>
                          </button>

                          {/* 3-dots menu — appears on hover */}
                          <div className="relative flex items-center pr-1" data-session-menu>
                            <button
                              type="button"
                              aria-label={`Options for chat "${session.title || 'New Chat'}"`}
                              title="Chat options"
                              onClick={() => setOpenMenuId(isMenuOpen ? null : session._id)}
                              className="rounded-lg p-1.5 text-gray-400 opacity-0 transition hover:bg-gray-300 hover:text-gray-700 focus:opacity-100 group-hover:opacity-100"
                            >
                              <MoreVertical size={14} strokeWidth={2} aria-hidden="true" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                                <button
                                  type="button"
                                  disabled={isPinning}
                                  onClick={() => handleTogglePin(session._id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-semibold text-[#1A1A1A] transition hover:bg-[#F5F5F5] disabled:opacity-50"
                                >
                                  {isPinning ? (
                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
                                  ) : session.isPinned ? (
                                    <PinOff size={13} strokeWidth={2} aria-hidden="true" />
                                  ) : (
                                    <Pin size={13} strokeWidth={2} aria-hidden="true" />
                                  )}
                                  {session.isPinned ? 'Unpin' : 'Pin'}
                                </button>
                                <div className="my-1 h-px bg-[#E5E5E5]" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setConfirmDeleteId(session._id);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                  <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Inline delete confirmation */}
                          {isDeleteActive && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center gap-1.5 rounded-lg bg-white/95 px-2 shadow-sm ring-1 ring-red-200">
                              <span className="max-w-[80px] truncate text-[10px] font-semibold text-gray-700">
                                Delete?
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(session._id)}
                                className="rounded-lg bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-red-700"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex items-center rounded-lg border border-gray-300 p-1 text-gray-600 transition hover:bg-gray-100"
                                aria-label="Cancel delete"
                              >
                                <X size={11} strokeWidth={2.5} aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </nav>
        ) : (
          /* ── Collapsed: icon-only session shortcuts ─────────────────────── */
          <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Chat history (collapsed)">
            {sessions.length === 0 ? (
              <p className="px-2 py-6 text-center text-[10px] leading-relaxed text-gray-400">
                No chats yet
              </p>
            ) : (
              <div className="space-y-0.5">
                {sessions.slice(0, 12).map((session) => {
                  const isActive = session._id === activeSessionId;
                  return (
                    <button
                      key={session._id}
                      type="button"
                      title={session.title || 'New Chat'}
                      onClick={() => handleSelectSession(session._id)}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition ${
                        isActive
                          ? 'bg-gray-200 text-black'
                          : 'text-gray-500 hover:bg-[#F5F5F5] hover:text-[#1A1A1A]'
                      }`}
                    >
                      <MessageSquare size={16} strokeWidth={1.9} aria-hidden="true" />
                      {session.isPinned && (
                        <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </nav>
        )}

        <div
          className={`border-t border-gray-200 text-[10px] text-gray-500 ${
            isSidebarOpen ? 'px-4 py-3' : 'flex h-10 items-center justify-center'
          }`}
        >
          {isSidebarOpen ? 'Chat history is saved automatically' : '📜'}
        </div>
      </aside>

      {/* ─── RIGHT: Main Chat Interface ───────────────────────────────────────── */}
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
                setActiveSessionId(null);
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
                disabled={inputPrompt.trim().length < 3 || isTyping}
                className={`absolute right-2.5 p-2 rounded-xl flex items-center justify-center transition-all ${
                  inputPrompt.trim().length >= 3 && !isTyping
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

            {/* Inline toast for UX validation messages */}
            {toast && (
              <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800 shadow-sm">
                {toast}
              </div>
            )}

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
