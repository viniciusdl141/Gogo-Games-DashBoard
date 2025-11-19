"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { getTrackingData, InfluencerTrackingEntry, InfluencerSummaryEntry, EventTrackingEntry, PaidTrafficEntry, DemoTrackingEntry, WLSalesEntry, ResultSummaryEntry, WlDetails } from '@/data/trackingData';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Eye, List, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; 

import ResultSummaryPanel from '@/components/dashboard/ResultSummaryPanel';
import WLSalesChartPanel from '@/components/dashboard/WLSalesChartPanel';
import InfluencerPanel from '@/components/dashboard/InfluencerPanel';
import EventPanel from '@/components/dashboard/EventPanel';
import PaidTrafficPanel from '@/components/dashboard/PaidTrafficPanel';
import DemoTrackingPanel from '@/components/dashboard/DemoTrackingPanel';
import KpiCard from '@/components/dashboard/KpiCard';
import WlDetailsPanel from '@/components/dashboard/WlDetailsPanel';
import AddInfluencerForm from '@/components/dashboard/AddInfluencerForm';
import AddEventForm from '@/components/dashboard/AddEventForm';
import AddPaidTrafficForm from '@/components/dashboard/AddPaidTrafficForm';
import GameSummaryPanel from '@/components/dashboard/GameSummaryPanel'; // <-- Novo Import
import { formatCurrency, formatNumber } from '@/lib/utils';

// Initialize data once
const initialData = getTrackingData();

// Helper to generate unique IDs locally
let localIdCounter = initialData.influencerTracking.length + initialData.eventTracking.length + initialData.paidTraffic.length + initialData.wlSales.length;
const generateLocalUniqueId = (prefix: string) => `${prefix}-${localIdCounter++}`;

const Dashboard = () => {
  const [trackingData, setTrackingData] = useState(initialData);
  const [selectedGame, setSelectedGame] = useState<string>(trackingData.games[0] || '');
  const [isAddInfluencerFormOpen, setIsAddInfluencerFormOpen] = useState(false);
  const [isAddEventFormOpen, setIsAddEventFormOpen] = useState(false);
  const [isAddPaidTrafficFormOpen, setIsAddPaidTrafficFormOpen] = useState(false);

  // --- Influencer Handlers ---

  const handleDeleteInfluencerEntry = useCallback((id: string) => {
    setTrackingData(prevData => ({
      ...prevData,
      influencerTracking: prevData.influencerTracking.filter(entry => entry.id !== id),
    }));
    toast.success("Entrada de influencer removida com sucesso.");
  }, []);

  const handleAddInfluencerEntry = useCallback((newEntry: Omit<InfluencerTrackingEntry, 'id' | 'roi' | 'date'> & { date: string }) => {
    const dateObject = new Date(newEntry.date);
    
    const roiValue = newEntry.estimatedWL > 0 
        ? newEntry.investment / newEntry.estimatedWL 
        : '-';

    const entryToAdd: InfluencerTrackingEntry = {
        ...newEntry,
        id: generateLocalUniqueId('influencer'),
        date: dateObject,
        roi: roiValue,
    };

    setTrackingData(prevData => ({
        ...prevData,
        influencerTracking: [...prevData.influencerTracking, entryToAdd].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0)),
    }));
    
    setIsAddInfluencerFormOpen(false);
  }, []);

  // --- Event Handlers ---

  const handleDeleteEventEntry = useCallback((id: string) => {
    setTrackingData(prevData => ({
      ...prevData,
      eventTracking: prevData.eventTracking.filter(entry => entry.id !== id),
    }));
    toast.success("Entrada de evento removida com sucesso.");
  }, []);

  const handleAddEventEntry = useCallback((newEntry: Omit<EventTrackingEntry, 'startDate' | 'endDate' | 'roi' | 'costPerView' | 'id'> & { startDate: string, endDate: string }) => {
    const startDateObject = new Date(newEntry.startDate);
    const endDateObject = new Date(newEntry.endDate);

    const roiValue = newEntry.wlGenerated > 0 
        ? newEntry.cost / newEntry.wlGenerated 
        : '-';

    const costPerViewValue = newEntry.views > 0 
        ? newEntry.cost / newEntry.views 
        : '-';

    const entryToAdd: EventTrackingEntry = {
        ...newEntry,
        id: generateLocalUniqueId('event'),
        startDate: startDateObject,
        endDate: endDateObject,
        roi: roiValue,
        costPerView: costPerViewValue,
    };

    setTrackingData(prevData => ({
        ...prevData,
        eventTracking: [...prevData.eventTracking, entryToAdd].sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)),
    }));
    
    setIsAddEventFormOpen(false);
  }, []);

  // --- Paid Traffic Handlers ---

  const handleDeletePaidTrafficEntry = useCallback((id: string) => {
    setTrackingData(prevData => ({
      ...prevData,
      paidTraffic: prevData.paidTraffic.filter(entry => entry.id !== id),
    }));
    toast.success("Entrada de tráfego pago removida com sucesso.");
  }, []);

  const handleAddPaidTrafficEntry = useCallback((newEntry: Omit<PaidTrafficEntry, 'startDate' | 'endDate' | 'networkConversion' | 'estimatedCostPerWL' | 'validatedCostPerWL'> & { startDate: string, endDate: string }) => {
    const startDateObject = new Date(newEntry.startDate);
    const endDateObject = new Date(newEntry.endDate);

    const networkConversion = newEntry.impressions > 0 
        ? newEntry.clicks / newEntry.impressions 
        : 0;

    const estimatedCostPerWL = newEntry.estimatedWishlists > 0 
        ? newEntry.investedValue / newEntry.estimatedWishlists 
        : '-';

    const entryToAdd: PaidTrafficEntry = {
        ...newEntry,
        id: generateLocalUniqueId('paid'),
        startDate: startDateObject,
        endDate: endDateObject,
        networkConversion: networkConversion,
        estimatedCostPerWL: estimatedCostPerWL,
        validatedCostPerWL: '-',
    };

    setTrackingData(prevData => ({
        ...prevData,
        paidTraffic: [...prevData.paidTraffic, entryToAdd].sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)),
    }));
    
    setIsAddPaidTrafficFormOpen(false);
  }, []);


  const filteredData = useMemo(() => {
    if (!selectedGame) return null;
    
    const game = selectedGame.trim();

    // 1. Filter and enhance data, recalculating dynamic fields
    const influencerTracking = trackingData.influencerTracking
        .filter(d => d.game.trim() === game)
        .map(item => ({
            ...item,
            roi: item.estimatedWL > 0 ? item.investment / item.estimatedWL : '-',
        }));
    
    const eventTracking = trackingData.eventTracking
        .filter(d => d.game.trim() === game)
        .map(item => ({
            ...item,
            roi: item.wlGenerated > 0 ? item.cost / item.wlGenerated : '-',
            costPerView: item.views > 0 ? item.cost / item.views : '-',
        }));

    const paidTraffic = trackingData.paidTraffic
        .filter(d => d.game.trim() === game)
        .map(item => ({
            ...item,
            networkConversion: item.impressions > 0 ? item.clicks / item.impressions : 0,
            estimatedCostPerWL: item.estimatedWishlists > 0 ? item.investedValue / item.estimatedWishlists : '-',
        }));
    
    const wlSales = trackingData.wlSales.filter(d => d.game.trim() === game);

    // 2. Recalculate Influencer Summary
    const influencerSummaryMap = new Map<string, { totalActions: number, totalInvestment: number, wishlistsGenerated: number }>();

    influencerTracking.forEach(item => {
        const influencer = item.influencer;
        const current = influencerSummaryMap.get(influencer) || { totalActions: 0, totalInvestment: 0, wishlistsGenerated: 0 };
        
        current.totalActions += 1;
        current.totalInvestment += item.investment;
        current.wishlistsGenerated += item.estimatedWL; 
        
        influencerSummaryMap.set(influencer, current);
    });

    const influencerSummary: InfluencerSummaryEntry[] = Array.from(influencerSummaryMap.entries()).map(([influencer, data]) => ({
        game: game,
        influencer: influencer,
        totalActions: data.totalActions,
        totalInvestment: data.totalInvestment,
        wishlistsGenerated: data.wishlistsGenerated,
        avgROI: data.wishlistsGenerated > 0 ? data.totalInvestment / data.wishlistsGenerated : '-',
    }));


    // 3. KPI Calculations
    const totalInvestment = 
        influencerTracking.reduce((sum, item) => sum + item.investment, 0) +
        eventTracking.reduce((sum, item) => sum + item.cost, 0) +
        paidTraffic.reduce((sum, item) => sum + item.investedValue, 0);

    const totalViews = 
        influencerTracking.reduce((sum, item) => sum + item.views, 0) +
        eventTracking.reduce((sum, item) => sum + item.views, 0) +
        paidTraffic.reduce((sum, item) => sum + item.impressions, 0);
    
    const totalWLGenerated = 
        influencerTracking.reduce((sum, item) => sum + item.estimatedWL, 0) +
        eventTracking.reduce((sum, item) => sum + item.wlGenerated, 0);
    
    // Total Sales and Wishlists (for Game Summary Panel)
    const totalSales = wlSales.reduce((sum, item) => sum + item.sales, 0);
    const totalWishlists = wlSales.length > 0 ? wlSales[wlSales.length - 1].wishlists : 0;


    return {
      resultSummary: trackingData.resultSummary.filter(d => d.game.trim() === game),
      wlSales,
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
          totalSales,
          totalWishlists,
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
                    <GameSummaryPanel 
                        gameName={selectedGame}
                        totalSales={filteredData.kpis.totalSales}
                        totalWishlists={filteredData.kpis.totalWishlists}
                        totalInvestment={filteredData.kpis.totalInvestment}
                    />
                    <div className="grid gap-4 md:grid-cols-3">
                        <KpiCard title="Investimento Total" value={formatCurrency(filteredData.kpis.totalInvestment)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                        <KpiCard title="Views + Impressões" value={formatNumber(filteredData.kpis.totalViews)} icon={<Eye className="h-4 w-4 text-muted-foreground" />} />
                        <KpiCard title="Wishlists Geradas (Est.)" value={formatNumber(filteredData.kpis.totalWLGenerated)} icon={<List className="h-4 w-4 text-muted-foreground" />} />
                    </div>
                    <ResultSummaryPanel data={filteredData.resultSummary} />
                </TabsContent>

                <TabsContent value="wl-sales" className="space-y-4 mt-4">
                    <WLSalesChartPanel data={filteredData.wlSales} />
                    <WlDetailsPanel details={filteredData.wlDetails} />
                </TabsContent>

                <TabsContent value="influencers" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <Dialog open={isAddInfluencerFormOpen} onOpenChange={setIsAddInfluencerFormOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsAddInfluencerFormOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" /> Adicionar Entrada
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Adicionar Novo Tracking de Influencer</DialogTitle>
                                </DialogHeader>
                                <AddInfluencerForm 
                                    games={trackingData.games} 
                                    onSave={handleAddInfluencerEntry} 
                                    onClose={() => setIsAddInfluencerFormOpen(false)} 
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                    <InfluencerPanel 
                        summary={filteredData.influencerSummary} 
                        tracking={filteredData.influencerTracking} 
                        onDeleteTracking={handleDeleteInfluencerEntry}
                    />
                </TabsContent>

                <TabsContent value="events" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <Dialog open={isAddEventFormOpen} onOpenChange={setIsAddEventFormOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsAddEventFormOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" /> Adicionar Evento
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Adicionar Novo Tracking de Evento</DialogTitle>
                                </DialogHeader>
                                <AddEventForm 
                                    games={trackingData.games} 
                                    onSave={handleAddEventEntry} 
                                    onClose={() => setIsAddEventFormOpen(false)} 
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                    <EventPanel data={filteredData.eventTracking} onDeleteTracking={handleDeleteEventEntry} />
                </TabsContent>

                <TabsContent value="paid-traffic" className="mt-4">
                    <div className="flex justify-end mb-4">
                        <Dialog open={isAddPaidTrafficFormOpen} onOpenChange={setIsAddPaidTrafficFormOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsAddPaidTrafficFormOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" /> Adicionar Tráfego Pago
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Adicionar Novo Tracking de Tráfego Pago</DialogTitle>
                                </DialogHeader>
                                <AddPaidTrafficForm 
                                    games={trackingData.games} 
                                    onSave={handleAddPaidTrafficEntry} 
                                    onClose={() => setIsAddPaidTrafficFormOpen(false)} 
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                    <PaidTrafficPanel data={filteredData.paidTraffic} onDeleteTracking={handleDeletePaidTrafficEntry} />
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