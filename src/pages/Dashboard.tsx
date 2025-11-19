"use client";

import React, { useState, useCallback } from 'react';
import { Game, getInitialGames } from '@/data/gameData';
import AddGameForm from '@/components/AddGameForm';
import GameList from '@/components/GameList';
import SummaryPanel from '@/components/SummaryPanel';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Dashboard = () => {
  const [games, setGames] = useState<Game[]>(getInitialGames());

  const handleAddGame = useCallback((newGame: Game) => {
    setGames(prevGames => [...prevGames, newGame]);
  }, []);

  const handleToggleBuySelection = useCallback((id: string) => {
    setGames(prevGames => 
      prevGames.map(game => 
        game.id === id ? { ...game, isBuySelected: !game.isBuySelected } : game
      )
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 dark:text-gray-50 mb-8">
          Dashboard de Rastreamento de Games
        </h1>

        {/* Seção 1: Resumo e Visualização Interativa */}
        <SummaryPanel games={games} />

        {/* Seção 2: Lista de Jogos e Seleção */}
        <GameList 
          games={games} 
          onToggleBuySelection={handleToggleBuySelection} 
        />

        {/* Seção 3: Adicionar Novo Jogo */}
        <AddGameForm onAddGame={handleAddGame} />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;