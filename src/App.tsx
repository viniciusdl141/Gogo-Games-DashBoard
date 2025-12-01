"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/Index';
import { SupabaseProvider } from './integrations/supabase/supabase-provider';
import ToastProvider from './components/ToastProvider';

function App() {
  return (
    <SupabaseProvider>
      <ToastProvider />
      <Router>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          {/* Add other routes here */}
        </Routes>
      </Router>
    </SupabaseProvider>
  );
}

export default App;