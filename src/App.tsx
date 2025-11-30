"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IndexPage from './pages/Index';
import ReferencesPage from './pages/References';
import { SessionContextProvider } from './components/SessionContextProvider';

// Cria uma instância do QueryClient
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider>
        <Router>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/references" element={<ReferencesPage />} />
            {/* Adicione outras rotas aqui conforme necessário */}
          </Routes>
        </Router>
      </SessionContextProvider>
    </QueryClientProvider>
  );
}

export default App;