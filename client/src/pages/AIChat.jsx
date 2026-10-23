import React, { useState, useRef, useEffect } from 'react';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
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

  // Mock function to simulate AI Legal Response
  const generateMockLegalResponse = (userQuery) => {
    const q = userQuery.toLowerCase();

    if (q.includes('bail') || q.includes('498') || q.includes('497') || q.includes('arrest')) {
      return `### ⚖️ Legal Analysis: Pre-Arrest Bail under Section 498 Cr.P.C.

**1. Statutory Framework:**
Section 498 read with Section 497 of the Code of Criminal Procedure (Cr.P.C.), 1898 governs the grant of bail before arrest. It is an extraordinary relief intended to protect innocent citizens from humiliation and unwarranted arrest.

**2. Mandatory Judicial Criteria:**
To succeed in a pre-arrest bail petition, the petitioner must demonstrate:
- **Ulterior Motives & Mala Fide:** Clear evidence that the complainant or investigating agency is motivated by malice, harassment, or extraneous considerations (*PLD 2021 SC 892*).
- **Physical Remand Not Required:** The recovery has already been effected or custodial interrogation is unnecessary for the investigation.
- **Prima Facie Inculpation Absent:** Reasonable grounds to believe that the accused is not guilty of a non-bailable offense.

**3. Recommended Strategy:**
Ensure that documentary evidence demonstrating personal enmity or civil disputes is annexed with the petition to substantiate the allegation of *mala fides*.`;
    }

    if (q.includes('writ') || q.includes('199') || q.includes('constitution') || q.includes('184')) {
      return `### 🏛️ Constitutional Law Analysis: Article 199 Jurisdiction

**1. Prerequisites for Constitutional Writs:**
Under Article 199 of the Constitution:
- **No Other Adequate Alternate Remedy:** The petitioner must show that no alternate, efficacious remedy is provided by law, or that the available remedy is illusory or onerous (*2022 SCMR 134*).
- **Aggrieved Party Standing:** The applicant must possess a direct, recognizable interest in the violation of a fundamental or legal right.

**2. Common Forms of Writs:**
- **Certiorari:** To quash quasi-judicial orders passed without jurisdiction or in excess of lawful authority.
- **Mandamus:** To compel a public authority to perform a statutory duty prescribed by law.
- **Prohibition:** To restrain subordinate forums from proceeding beyond jurisdiction.

**3. Citation Reference:**
*Federation of Pakistan vs. Gulzar Ahmed (PLD 2024 SC 182)* reaffirms that discretionary writ relief will not be withheld where fundamental rights under Part II Chapter 1 are blatantly infringed.`;
    }

    if (q.includes('contract') || q.includes('damages') || q.includes('breach')) {
      return `### 📜 Commercial Law Analysis: Breach of Contract & Damages

**1. Governing Statute:**
Sections 73 and 74 of the **Contract Act, 1872** govern the consequences of a breach of contract:
- **Direct & Natural Consequences:** Only compensation for loss naturally arising in the usual course of things from such breach is recoverable. Remote or indirect damage cannot be granted.
- **Mitigation Principle:** The aggrieved party is legally bound to take all reasonable steps to mitigate the loss incurred.

**2. Liquidated vs. Unliquidated Damages:**
Under Section 74, even if a predetermined penalty amount is stipulated in the agreement, the Court will only award *reasonable compensation* not exceeding the stipulated penalty, based on actual proved loss.`;
    }

    // Default intelligent legal analysis template
    return `### 📑 Legal Opinion & Case Analysis

Thank you for your inquiry regarding: **"${userQuery}"**

**1. Statutory Context & Legal Principles:**
Under established jurisprudence, this subject matter involves the interpretation of applicable procedural and substantive enactments. The courts apply a purposive construction while safeguarding fundamental liberties and procedural fairness.

**2. Key Precedent & Doctrinal Ratio:**
- The courts consistently examine whether the grievance satisfies the statutory threshold before granting discretionary relief.
- Established precedents require that all material assertions be substantiated by contemporaneous documentary records.

**3. Actionable Next Steps:**
1. Verify the relevant statutory timelines (Limitation Act schedules).
2. Gather corresponding certified copies of public records and official notifications.
3. Formulate the petition prayer with specific and distinct declaratory reliefs.

*Would you like me to draft formal petition grounds or search specific case citations from the database?*`;
  };

  const handleSend = () => {
    const trimmed = inputPrompt.trim();
    if (!trimmed || isTyping) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Append user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsTyping(true);

    // Simulate AI thinking and response delay (mock function)
    setTimeout(() => {
      const responseText = generateMockLegalResponse(trimmed);
      const assistantMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 900);
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
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* ─── Left Sidebar (ChatGPT-style) ────────────────────────────────────── */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 ease-in-out bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 relative overflow-hidden`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20">
              ⚖️
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">Case Lens AI</h2>
              <p className="text-xs text-sky-400 font-medium">Legal Research Suite</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-semibold text-sm transition-all shadow-md shadow-sky-600/25 active:scale-[0.98]"
          >
            <span className="text-base font-bold">+</span>
            <span>New Research Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
            Recent Consultations
          </div>
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors text-sm group ${
                activeChatId === chat.id
                  ? 'bg-slate-800/80 text-white font-medium border border-slate-700/60'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <span className="text-slate-500 group-hover:text-sky-400 text-xs">💬</span>
              <span className="truncate flex-1">{chat.title}</span>
            </button>
          ))}
        </div>

        {/* Sidebar Footer User Badge */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/70">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
              JT
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Advocate Jawad</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                CaseLens Pro Active
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Chat Interface ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full bg-slate-900 relative">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Open Sidebar"
              >
                ☰
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <h1 className="font-semibold text-slate-100 text-sm md:text-base">AI Legal Assistant</h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950 text-sky-400 border border-sky-800">
                GPT-4 Legal Core v1.1
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition font-medium border border-slate-700/50"
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
              className="text-xs px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
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
                <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-3xl mb-3">
                  ⚖️
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-100">AI Legal Intelligence Platform</h3>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
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
                    className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="font-semibold text-xs md:text-sm text-slate-200 group-hover:text-sky-400 flex items-center justify-between">
                      <span>{item.title}</span>
                      <span className="text-slate-500 group-hover:text-sky-400 text-xs">→</span>
                    </div>
                    <div className="text-[11px] md:text-xs text-slate-400 mt-1 line-clamp-2">
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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white text-sm flex-shrink-0 shadow-md shadow-sky-500/20 mt-1">
                    ⚖️
                  </div>
                )}

                {/* Message Content Bubble */}
                <div
                  className={`max-w-[85%] md:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none shadow-md shadow-sky-600/20'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Sender Header for Assistant */}
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-700/50">
                      <span className="font-semibold text-xs text-sky-400">Case Lens AI Assistant</span>
                      <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                    </div>
                  )}

                  {/* Message Body with clean paragraph/markdown support */}
                  <div className="whitespace-pre-wrap space-y-2">
                    {msg.text}
                  </div>

                  {/* Actions Bar for Assistant Messages */}
                  {msg.sender === 'assistant' && (
                    <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[10px] text-slate-500">CaseLens Legal Engine</span>
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="hover:text-sky-400 transition flex items-center gap-1 text-[11px]"
                      >
                        {copiedId === msg.id ? '✓ Copied' : '📋 Copy analysis'}
                      </button>
                    </div>
                  )}

                  {/* Timestamp for User */}
                  {msg.sender === 'user' && (
                    <div className="text-[10px] text-sky-200/80 text-right mt-1.5">
                      {msg.timestamp}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-1">
                    You
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3.5 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white text-sm flex-shrink-0 shadow-md shadow-sky-500/20">
                  ⚖️
                </div>
                <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 mr-1 font-medium">Analyzing legal corpus</span>
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ─── Bottom Floating Input Box (ChatGPT-style) ──────────────────────── */}
        <div className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur p-3 md:p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-slate-900 border border-slate-700/80 focus-within:border-sky-500 rounded-2xl shadow-xl transition-all">
              <textarea
                ref={inputRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows="1"
                placeholder="Ask legal questions, cite case facts, or request statutory research..."
                className="w-full bg-transparent text-slate-100 placeholder-slate-400 px-4 py-3.5 pr-14 text-sm outline-none resize-none min-h-[48px] max-h-36"
                style={{ scrollbarWidth: 'none' }}
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!inputPrompt.trim() || isTyping}
                className={`absolute right-2.5 p-2 rounded-xl flex items-center justify-center transition-all ${
                  inputPrompt.trim() && !isTyping
                    ? 'bg-sky-600 text-white hover:bg-sky-500 shadow-md shadow-sky-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title="Send Message (Enter)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            </div>

            {/* Disclaimer Subtitle */}
            <p className="text-[11px] text-center text-slate-500 mt-2">
              Case Lens AI Assistant is designed for legal research support. Please verify citations against official law reporters (PLD, SCMR, CLC).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
