"use client";

import React from 'react';
import SteamDataProcessor from '@/components/SteamDataProcessor';

const IndexPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Gerenciamento de Jogos</h1>
      
      <SteamDataProcessor />
      
      {/* You can add other components here later */}
    </div>
  );
};

export default IndexPage;