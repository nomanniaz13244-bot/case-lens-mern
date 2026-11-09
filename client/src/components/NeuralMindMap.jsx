import React, { useState } from 'react';

const SATELLITE_CONFIG = [
  { key: 'facts', label: 'Facts & Timeline', icon: '📁', pos: 'top-[10%] left-[5%]' },
  { key: 'caseLaws', label: 'Case Laws & Statutes', icon: '📚', pos: 'top-[10%] right-[5%]' },
  { key: 'precedent', label: 'Precedent Comparison', icon: '⚖️', pos: 'top-[45%] left-[2%]' },
  { key: 'supporting', label: 'Supporting/Contradicting', icon: '🛡️', pos: 'top-[45%] right-[2%]' },
  { key: 'opposing', label: 'Opposing Arguments', icon: '⚔️', pos: 'bottom-[10%] left-[5%]' },
  { key: 'strengths', label: 'Strengths & Weaknesses', icon: '💡', pos: 'bottom-[10%] right-[5%]' },
];

export default function NeuralMindMap({ caseTitle, caseData }) {
  const [selectedNode, setSelectedNode] = useState(null);

  if (!caseData) {
    return (
      <div className="w-full h-[75vh] bg-[#050B14] flex items-center justify-center text-cyan-500 font-mono animate-pulse rounded-xl border border-cyan-900/50">
        INITIALIZING NEURAL LINK...
      </div>
    );
  }

  const title = caseData.caseTitle || caseTitle || 'Case File';
  const summary = caseData.summary || 'Analyzing case parameters...';

  const getNodeData = (key) => {
    switch (key) {
      case 'facts': return caseData.facts || 'No facts available.';
      case 'caseLaws':
        const laws = caseData.lawsApplied || caseData.legalLaws || caseData.caseLaws || [];
        return Array.isArray(laws) ? laws.join('\n') : laws || 'No laws available.';
      case 'precedent': return caseData.precedentComparison || 'No precedent data.';
      case 'supporting': return caseData.supportingContradicting || 'No supporting evidence.';
      case 'opposing': return caseData.opposingArguments || 'No opposing arguments.';
      case 'strengths': return caseData.strengthsWeaknesses || 'No strengths/weaknesses.';
      default: return '';
    }
  };

  return (
    <div className="relative w-full h-[75vh] min-h-[600px] bg-[#050B14] overflow-hidden rounded-xl border border-cyan-900/30 font-sans">
      
      <style>
        {`
          @keyframes dash {
            to { stroke-dashoffset: -100; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 30px rgba(6, 182, 212, 0.4); border-color: rgba(6, 182, 212, 0.5); }
            50% { box-shadow: 0 0 60px rgba(6, 182, 212, 0.8); border-color: rgba(6, 182, 212, 1); }
          }
          .animated-line {
            stroke-dasharray: 12;
            animation: dash 2s linear infinite;
          }
          .float-node {
            animation: float 6s ease-in-out infinite;
          }
          .pulse-core {
            animation: pulse-glow 3s ease-in-out infinite;
          }
        `}
      </style>

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f49_1px,transparent_1px),linear-gradient(to_bottom,#082f49_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Lines connecting from exact center (50%, 50%) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <line x1="50%" y1="50%" x2="15%" y2="20%" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="15%" y2="20%" className="animated-line" stroke="#06b6d4" strokeWidth="2" />
        
        <line x1="50%" y1="50%" x2="85%" y2="20%" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="85%" y2="20%" className="animated-line" stroke="#06b6d4" strokeWidth="2" />

        <line x1="50%" y1="50%" x2="12%" y2="50%" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="12%" y2="50%" className="animated-line" stroke="#06b6d4" strokeWidth="2" />

        <line x1="50%" y1="50%" x2="88%" y2="50%" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="88%" y2="50%" className="animated-line" stroke="#06b6d4" strokeWidth="2" />

        <line x1="50%" y1="50%" x2="15%" y2="80%" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="15%" y2="80%" className="animated-line" stroke="#06b6d4" strokeWidth="2" />

        <line x1="50%" y1="50%" x2="85%" y2="80%" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="2" />
        <line x1="50%" y1="50%" x2="85%" y2="80%" className="animated-line" stroke="#06b6d4" strokeWidth="2" />
      </svg>

      {/* PERFECTLY CENTERED CIRCLE (Size reduced to fit) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="bg-[#0A1526] border-2 border-cyan-500 rounded-full w-[280px] h-[280px] flex flex-col items-center justify-center p-6 shadow-[0_0_30px_rgba(6,182,212,0.4)] relative text-center pulse-core">
          
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 bg-cyan-500 text-[#050B14] text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase whitespace-nowrap">
            AI Neural Core
          </div>

          <h2 className="text-white text-[15px] font-bold mb-2 leading-tight text-center px-2">{title}</h2>
          <p className="text-cyan-100/70 text-[11px] leading-relaxed text-center px-2 line-clamp-4">{summary}</p>
          
          <div className="mt-3 flex justify-center items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase">Reasoning Active</span>
          </div>
        </div>
      </div>

      {/* SATELLITE NODES */}
      {SATELLITE_CONFIG.map((node) => (
        <div 
          key={node.key}
          className={`absolute w-48 z-10 cursor-pointer float-node ${node.pos}`}
          style={{ animationDelay: `${Math.random() * 2}s` }}
          onClick={() => setSelectedNode(node)}
        >
          <div className="bg-[#0A1526]/90 backdrop-blur-md border border-cyan-900/50 hover:border-cyan-400 rounded-xl p-4 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{node.icon}</span>
              <h3 className="text-cyan-50 text-sm font-bold truncate">{node.label}</h3>
            </div>
            <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
              {getNodeData(node.key).substring(0, 50)}...
            </p>
            <div className="mt-3 flex justify-between items-center text-[10px] text-cyan-500/70 font-mono group-hover:text-cyan-400">
              <span>INSPECT</span>
              <span>→</span>
            </div>
          </div>
        </div>
      ))}

      {/* SIDE PANEL */}
      {selectedNode && (
        <div className="absolute top-0 right-0 w-96 h-full bg-[#0A1526] border-l border-cyan-500/30 z-50 flex flex-col shadow-2xl">
          <div className="p-4 border-b border-cyan-900/30 flex justify-between items-center bg-[#050B14]">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider">
              <span>{selectedNode.icon}</span>
              <span>{selectedNode.label}</span>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-red-500/20 px-2 py-1 rounded transition-colors">✕</button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {getNodeData(selectedNode.key)}
            </p>
          </div>
          <div className="p-4 bg-[#050B14] border-t border-cyan-900/30 text-[10px] text-cyan-600 font-mono text-center tracking-widest">
            END OF {selectedNode.label.toUpperCase()} STREAM
          </div>
        </div>
      )}
    </div>
  );
}