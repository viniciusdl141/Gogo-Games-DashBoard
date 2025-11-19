"use client";

import React, { useState, useMemo } from 'react';
import { getTrackingData } from '@/data/trackingData';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import ResultSummaryPanel from '@/components/dashboard/ResultSummaryPanel';
import WLSalesChartPanel from '@/components/dashboard/WLSalesChartPanel';
import InfluencerPanel from '@/components/dashboard/InfluencerPanel';
import EventPanel from '@/components/dashboard/EventPanel';
import PaidTrafficPanel from '@/components/dashboard/PaidTrafficPanel';
import DemoTrackingPanel from '@/components/dashboard/DemoTrackingPanel';

const Dashboard = () => {
  const trackingData = useMemo(() => getTrackingData(), []);
  const [selectedGame, setSelectedGame] = useState<string>(trackingData.games[0] || '');

  const filteredData = useMemo(() => {
    if (!selectedGame) return null;
    
    const game = selectedGame.trim();

    return {
      resultSummary: trackingData.resultSummary.filter(d => d.game.trim() === game),
      wlSales: trackingData.wlSales.filter(d => d.game.trim() === game),
      influencerSummary: trackingData.influencerSummary.filter(d => d.game.trim() === game),
      influencerTracking: trackingData.influencerTracking.filter(d => d.game.trim() === game),
      eventTracking: trackingData.eventTracking.filter(d => d.game.trim() === game),
      paidTraffic: trackingData.paidTraffic.filter(d => d.game.trim() === game),
      demoTracking: trackingData.demoTracking.filter(d => d.game.trim() === game),
    };
  }, [selectedGame, trackingData]);

  if (trackingData.games.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <Card className="p-6">
                <h1 className="text-2xl font-bold mb-4">Dashboard de Rastreamento de Games</h1>
                <p className="text-muted-foreground">Nenhum dado de rastreamento encontrado.</p>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 dark:text-gray-50 mb-8">
          Dashboard de Performance de Marketing
        </h1>

        {/* Seletor de Jogo */}
        <Card className="p-4">
            <CardContent className="flex flex-col md:flex-row items-center gap-4 p-0">
                <label className="font-semibold text-lg min-w-[150px]">Selecionar Jogo:</label>
                <Select onValueChange={setSelectedGame} defaultValue={selectedGame}>
                    <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Selecione um jogo" />
                    </SelectTrigger>
                    <SelectContent>
                        {trackingData.games.map(game => (
                            <SelectItem key={game} value={game}>{game}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

        {filteredData && (
            <div className="space-y-8">
                {/* Seção 1: Resumo de Resultados (ROI/Conversão) */}
                <ResultSummaryPanel data={filteredData.resultSummary} />

                {/* Seção 2: Evolução Diária (WL e Vendas) */}
                <WLSalesChartPanel data={filteredData.wlSales} />

                {/* Seção 3: Tracking de Influencers */}
                <InfluencerPanel 
                    summary={filteredData.influencerSummary} 
                    tracking={filteredData.influencerTracking} 
                />

                {/* Seção 4: Tracking de Eventos */}
                <EventPanel data={filteredData.eventTracking} />

                {/* Seção 5: Tráfego Pago */}
                <PaidTrafficPanel data={filteredData.paidTraffic} />

                {/* Seção 6: Tracking da Demo */}
                <DemoTrackingPanel data={filteredData.demoTracking} />
            </div>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;