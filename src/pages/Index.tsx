"use client";

import React from 'react';
import ProcessJsonButton from '@/components/ProcessJsonButton';
import ToastProvider from '@/components/ToastProvider';

// ATENÇÃO: Este arquivo foi atualizado para incluir o ToastProvider e o ProcessJsonButton.
// Por favor, verifique se o conteúdo original do seu dashboard foi mantido.

const Index: React.FC = () => {
  return (
    <ToastProvider>
      <div className="p-4">
        {/* Novo botão adicionado no topo, alinhado à direita */}
        <div className="flex justify-end mb-6">
          <ProcessJsonButton />
        </div>
        
        {/* Conteúdo existente do Dashboard deve continuar aqui */}
        <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
        <p className="text-gray-600">
          (Seu conteúdo original do dashboard deve ser mantido abaixo deste ponto.)
        </p>
      </div>
    </ToastProvider>
  );
};

export default Index;