"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/Index';
import { SessionContextProvider } from './components/SessionContextProvider';
import ToastProvider from '@/components/ToastProvider';

function App() {
  return (
    <SessionContextProvider>
      <ToastProvider />
      <Router>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          {/* Add other routes here */}
        </Routes>
      </Router>
    </SessionContextProvider>
  );
}

export default App;