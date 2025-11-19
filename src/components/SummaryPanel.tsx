"use client";

import React, { useMemo } from 'react';
import { Game } from '@/data/gameData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SummaryPanelProps {
    games: Game[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SummaryPanel: React.FC<SummaryPanelProps> = ({ games }) => {
  const selectedGames = games.filter(game => game.isBuySelected);
  const totalCost = selectedGames.reduce((sum, game) => sum + game.price, 0);

  const statusData = useMemo(() => {
    const counts = games.reduce((acc, game) => {
      acc[game.status] = (acc[game.status] || 0) + 1;
      return acc;
    }, {} as Record<Game['status'], number>);

    return Object.entries(counts).map(([status, count], index) => ({
      name: status === 'Upcoming' ? 'Próximo' : status === 'Released' ? 'Lançado' : 'Desejo',
      value: count,
      color: COLORS[index % COLORS.length],
    }));
  }, [games]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Resumo de Compra */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Compra (Selecionados)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-2xl font-bold">
            Total de Jogos Selecionados: {selectedGames.length}
          </p>
          <p className="text-3xl font-extrabold text-primary">
            Custo Total Estimado: R$ {totalCost.toFixed(2).replace('.', ',')}
          </p>
          
          <Separator />

          {selectedGames.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto p-2 border rounded-md">
              {selectedGames.map(game => (
                <li key={game.id} className="text-sm flex justify-between">
                    <span>{game.name} ({game.publisher})</span>
                    <span className="font-semibold">R$ {game.price.toFixed(2).replace('.', ',')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Selecione jogos na lista para ver o resumo de compra.</p>
          )}
        </CardContent>
      </Card>

      {/* Dashboard de Status */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Status</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {games.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} jogos`} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum dado para exibir. Adicione jogos!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryPanel;