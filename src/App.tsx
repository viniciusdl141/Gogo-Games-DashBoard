"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/Index';
import ReferencesPage from './pages/References';
import { SessionContextProvider } from './components/SessionContextProvider'; // Importando o provedor de sessão

function App() {
  return (
    <SessionContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/references" element={<ReferencesPage />} />
          {/* Adicione outras rotas aqui conforme necessário */}
        </Routes>
      </Router>
    </SessionContextProvider>
  );
}

export default App;