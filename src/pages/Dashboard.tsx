"use client";

import React, { useState, useMemo } from 'react';
import { getTrackingData } from '@/data/trackingData';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, DollarSign, Eye, List } from 'lucide-react';

import ResultSummaryPanel from '@/components/dashboard/ResultSummaryPanel';
import WLSalesChartPanel from '@/components/dashboard/WLSalesChartPanel';
import InfluencerPanel from '@/components/dashboard/InfluencerPanel';
import EventPanel from '@/components/dashboard/EventPanel';
import PaidTrafficPanel from '@/components/dashboard/PaidTrafficPanel';
import DemoTrackingPanel from '@/components/dashboard/DemoTrackingPanel';
import KpiCard from '@/components/dashboard/KpiCard';
import WlDetailsPanel from '@/components/dashboard/WlDetailsPanel';
import { formatCurrency, formatNumber } from '@/lib/utils';

const Dashboard = () => {
  const trackingData = useMemo(() => getTrackingData(), []);
  const [selectedGame, setSelectedGame] = useState<string>(trackingData.games[0] || '');

  const filteredData = useMemo(() => {
    if (!selectedGame) return null;
    
    const game = selectedGame.trim();

    const influencerTracking = trackingData.influencerTracking.filter(d => d.game.trim() === game);
    const eventTracking = trackingData.eventTracking.filter(d => d.game.trim() === game);
    const paidTraffic = trackingData.paidTraffic.filter(d => d.game.trim() === game);
    const influencerSummary = trackingData.influencerSummary.filter(d => d.game.trim() === game);

    const totalInvestment = 
        influencerTracking.reduce((sum, item) => sum + item.investment, 0) +
        eventTracking.reduce((sum, item) => sum + item.cost, 0) +
        paidTraffic.reduce((sum, item) => sum + item.investedValue, 0);

    const totalViews = 
        influencerTracking.reduce((sum, item) => sum + item.views, 0) +
        eventTracking.reduce((sum, item) => sum + item.views, 0) +
        paidTraffic.reduce((sum, item) => sum + item.impressions, 0);
    
    const totalWLGenerated = 
        influencerSummary.reduce((sum, item) => sum + item.wishlistsGenerated, 0) +
        eventTracking.reduce((sum, item) => sum + item.wlGenerated, 0);


    return {
      resultSummary: trackingData.resultSummary.filter(d => d.game.trim() === game),
      wlSales: trackingData.wlSales.filter(d => d.game.trim() === game),
      influencerSummary,
      influencerTracking,
      eventTracking,
      paidTraffic,
      demoTracking: trackingData.demoTracking.filter(d => d.game.trim() === game),
      wlDetails: trackingData.wlDetails.find(d => d.game.trim() === game),
      kpis: {
          totalInvestment,
          totalViews,
          totalWLGenerated,
      }
    };
  }, [selectedGame, trackingData]);

  if (trackingData.games.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <Card className="p-6">
                <h1 className="text-2xl font-bold mb-4">Dashboard de Rastreamento</h1>
                <p className="text-muted-foreground">Nenhum dado de rastreamento encontrado.</p>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50">
            Dashboard de Performance de Marketing
            </h1>
            <p className="text-muted-foreground mt-2">Análise de campanhas e resultados de jogos</p>
        </header>

        <Card>
            <CardContent className="flex flex-col md:flex-row items-center gap-4 p-4">
                <label htmlFor="game-select" className="font-semibold text-lg min-w-[150px]">Selecionar Jogo:</label>
                <Select onValueChange={setSelectedGame} defaultValue={selectedGame}>
                    <SelectTrigger id="game-select" className="w-full md:w-[300px]">
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
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="wl-sales">Wishlists</TabsTrigger>
                    <TabsTrigger value="influencers">Influencers</TabsTrigger>
                    <TabsTrigger value="events">Eventos</TabsTrigger>
                    <TabsTrigger value="paid-traffic">Tráfego Pago</TabsTrigger>
                    <TabsTrigger value="demo">Demo</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <KpiCard title="Investimento Total" value={formatCurrency(filteredData.kpis.totalInvestment)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                        <KpiCard title="Views + Impressões" value={formatNumber(filteredData.kpis.totalViews)} icon={<Eye className="h-4 w-4 text-muted-foreground" />} />
                        <KpiCard title="Wishlists Geradas (Eventos + Influencers)" value={formatNumber(filteredData.kpis.totalWLGenerated)} icon={<List className="h-4 w-4 text-muted-foreground" />} />
                    </div>
                    <ResultSummaryPanel data={filteredData.resultSummary} />
                </TabsContent>

                <TabsContent value="wl-sales" className="space-y-4 mt-4">
                    <WLSalesChartPanel data={filteredData.wlSales} />
                    <WlDetailsPanel details={filteredData.wlDetails} />
                </TabsContent>

                <TabsContent value="influencers" className="mt-4">
                    <InfluencerPanel 
                        summary={filteredData.influencerSummary} 
                        tracking={filteredData.influencerTracking} 
                    />
                </TabsContent>

                <TabsContent value="events" className="mt-4">
                    <EventPanel data={filteredData.eventTracking} />
                </TabsContent>

                <TabsContent value="paid-traffic" className="mt-4">
                    <PaidTrafficPanel data={filteredData.paidTraffic} />
                </TabsContent>

                <TabsContent value="demo" className="mt-4">
                    <DemoTrackingPanel data={filteredData.demoTracking} />
                </TabsContent>
            </Tabs>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;