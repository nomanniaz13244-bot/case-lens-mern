import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bot,
  BookOpen,
  FilePenLine,
  FolderOpen,
  FolderPlus,
  Gavel,
  LayoutDashboard,
  Search,
} from 'lucide-react';

const groups = [
  { title: 'CORE', links: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/workspace', label: 'New Case', icon: FolderPlus },
    { to: '/my-cases', label: 'My Cases', icon: FolderOpen },
  ]},
  { title: 'RESEARCH & ANALYSIS', links: [
    { to: '/research', label: 'Legal Research', icon: Search },
    { to: '/ai-chat', label: 'Legal AI Assistant', icon: Bot },
    { to: '/laws', label: 'Case Laws', icon: Gavel },
  ]},
  { title: 'DRAFTING & REFERENCE', links: [
    { to: '/drafting', label: 'Legal Drafting', icon: FilePenLine },
    { to: '/dictionary', label: 'Legal Dictionary', icon: BookOpen },
  ]},
];

export default function SidePanel() {
  return (
    <aside className="hidden w-[265px] flex-shrink-0 border-r border-[#E5E5E5] bg-white md:flex md:flex-col">
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-lg text-white">CL</div>
          <div><p className="text-sm font-bold text-black">Case Lens</p><p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Legal Intelligence</p></div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-5" aria-label="Primary navigation">
        {groups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.18em] text-gray-500">{group.title}</p>
            <div className="space-y-1">
              {group.links.map((link) => (
                <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${isActive ? 'bg-black text-white shadow-sm' : 'text-black hover:bg-[#F5F5F5]'}`}>
                  <link.icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-[#E5E5E5] px-5 py-4 text-[11px] text-gray-500">Secure Legal Workspace</div>
    </aside>
  );
}
