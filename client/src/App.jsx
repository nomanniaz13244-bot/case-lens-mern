import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Search from './pages/Search';
import AdminCases from './pages/AdminCases';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/admin" element={<AdminCases />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
