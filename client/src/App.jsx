import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Search from './pages/Search';
import AIChat from './pages/AIChat';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CaseDetail from './pages/CaseDetail';
import CaseWorkspace from './pages/CaseWorkspace';
import ComingSoon from './pages/ComingSoon';
import MyCases from './pages/MyCases';
import Facts from './pages/case-tabs/Facts';
import LegalIssues from './pages/case-tabs/LegalIssues';
import CaseLaws from './pages/case-tabs/CaseLaws';
import Precedents from './pages/case-tabs/Precedents';
import Arguments from './pages/case-tabs/Arguments';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import SidePanel from './components/SidePanel';
import ProtectedRoute from './components/ProtectedRoute';

const protectedPage = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#F5F5F5] text-[#111827] flex flex-col font-sans">
          <Navbar />
          <div className="flex-1 flex overflow-hidden">
            <SidePanel />
            <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
              <Routes>
                <Route path="/" element={<div className="flex-1 overflow-y-auto"><Search /></div>} />
                <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
                <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
                <Route path="/workspace" element={protectedPage(<CaseWorkspace />)} />
                <Route path="/my-cases" element={protectedPage(<MyCases />)} />
                <Route path="/ai-chat" element={protectedPage(<AIChat />)} />
                <Route path="/research" element={protectedPage(<ComingSoon />)} />
                <Route path="/laws" element={protectedPage(<ComingSoon />)} />
                <Route path="/analysis" element={protectedPage(<ComingSoon />)} />
                <Route path="/opposition" element={protectedPage(<ComingSoon />)} />
                <Route path="/drafting" element={protectedPage(<ComingSoon />)} />
                <Route path="/dictionary" element={protectedPage(<ComingSoon />)} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/case-detail/:caseId" element={protectedPage(<CaseDetail />)} />
                <Route path="/case-detail/:caseId/facts" element={protectedPage(<Facts />)} />
                <Route path="/case-detail/:caseId/legal-issues" element={protectedPage(<LegalIssues />)} />
                <Route path="/case-detail/:caseId/case-laws" element={protectedPage(<CaseLaws />)} />
                <Route path="/case-detail/:caseId/precedents" element={protectedPage(<Precedents />)} />
                <Route path="/case-detail/:caseId/arguments" element={protectedPage(<Arguments />)} />
                <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
