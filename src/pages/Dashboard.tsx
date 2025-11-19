"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { getTrackingData, InfluencerTrackingEntry, InfluencerSummaryEntry, EventTrackingEntry, PaidTrafficEntry, DemoTrackingEntry, WLSalesPlatformEntry, ResultSummaryEntry, WlDetails, SaleType, Platform } from '@/data/trackingData';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Eye, List, Plus, Gamepad2, EyeOff, Image as ImageIcon } from 'lucide-react'; // Importar ImageIcon
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"; // Importar DialogFooter
import { Button } from "@/components/ui/button"; 
import { Input } from '@/components/ui/input'; // Importar Input
import { Label } from '@/components/ui/label'; // Importar Label

import ResultSummaryPanel from '@/components/dashboard/ResultSummaryPanel';
import WLSalesChartPanel from '@/components/dashboard/WLSalesChartPanel';
import WLSalesTablePanel from '@/components/dashboard/WLSalesTablePanel';
import SalesByTypeChart from '@/components/dashboard/SalesByTypeChart';
import InfluencerPanel from '@/components/dashboard/InfluencerPanel';
import EventPanel from '@/components/dashboard/EventPanel';
import PaidTrafficPanel from '@/components/dashboard/PaidTrafficPanel';
import DemoTrackingPanel from '@/components/dashboard/DemoTrackingPanel';
import KpiCard from '@/components/dashboard/KpiCard';
import WlDetailsManager from '@/components/dashboard/WlDetailsManager';
import AddInfluencerForm from '@/components/dashboard/AddInfluencerForm';
import AddEventForm from '@/components/dashboard/AddEventForm';
import AddPaidTrafficForm from '@/components/dashboard/AddPaidTrafficForm';
import AddWLSalesForm from '@/components/dashboard/AddWLSalesForm';
import EditWLSalesForm from '@/components/dashboard/EditWLSalesForm';
import GameSummaryPanel from '@/components/dashboard/GameSummaryPanel';
import ExportDataButton from '@/components/dashboard/ExportDataButton';
import { formatCurrency, formatNumber } from '@/lib/utils';
import AddGameForm from '@/components/dashboard/AddGameForm';
import WlComparisonsPanel from '@/components/dashboard/WlComparisonsPanel'; // Importar o novo painel

// Initialize data once
const initialData = getTrackingData();

// Helper to generate unique IDs locally
let localIdCounter = initialData.influencerTracking.length + initialData.eventTracking.length + initialData.paidTraffic.length + initialData.wlSales.length;
const generateLocalUniqueId = (prefix: string) => `${prefix}-${localIdCounter++}`;

const ALL_PLATFORMS: Platform[] = ['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Android', 'iOS', 'Epic Games', 'Outra'];

const Dashboard = () => {
  const [trackingData, setTrackingData] = useState(initialData);
  const [selectedGame, setSelectedGame] = useState<string>(trackingData.games[0] || '');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'All'>('All');
  
  const [isAddInfluencerFormOpen, setIsAddInfluencerFormOpen] = useState(false);
  const [isAddEventFormOpen, setIsAddEventFormOpen] = useState(false);
  const [isAddPaidTrafficFormOpen, setIsAddPaidTrafficFormOpen] = useState(false);
  const [isAddWLSalesFormOpen, setIsAddWLSalesFormOpen] = useState(false);
  const [isAddGameFormOpen, setIsAddGameFormOpen] = useState(false);
  const [editingWLSalesEntry, setEditingWLSalesEntry] = useState<WLSalesPlatformEntry | null>(null);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  // Removendo estados relacionados à edição do logo
  // const [isLogoEditDialogOpen, setIsLogoEditDialogOpen] = useState(false); 
  // const [currentLogoUrl, setCurrentLogoUrl] = useState('/gogo-games-logo.png'); 
  // const [newLogoUrl, setNewLogoUrl] = useState(''); 

  // Função auxiliar para recalcular variações de WL
  const recalculateWLSales = useCallback((wlSales: WLSalesPlatformEntry[], game: string, platform: Platform): WLSalesPlatformEntry[] => {
    const gamePlatformEntries = wlSales
        .filter(e => e.game === game && e.platform === platform)
        .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
        
    const otherEntries = wlSales.filter(e => e.game !== game || e.platform !== platform);

    let lastWL = 0;
    const recalculatedGamePlatformEntries = gamePlatformEntries.map(entry => {
        const currentWL = entry.wishlists;
        const currentVariation = currentWL - lastWL;
        lastWL = currentWL;
        return { ...entry, variation: currentVariation };
    });

    return [...otherEntries, ...recalculatedGamePlatformEntries].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
  }, []);

  // --- Game Management Handler ---
  const handleAddGame = useCallback((gameName: string) => {
    if (trackingData.games.includes(gameName)) {
        toast.error(`O jogo "${gameName}" já existe.`);
        return;
    }
    setTrackingData(prevData => ({
        ...prevData,
        games: [...prevData.games, gameName].sort(),
        // Initialize WL details for the new game (empty)
        wlDetails: [...prevData.wlDetails, { game: gameName, reviews: [], bundles: [], traffic: [] }],
    }));
    setSelectedGame(gameName);
    toast.success(`Jogo "${gameName}" adicionado com sucesso!`);
  }, [trackingData.games]);


  // --- WL/Sales Handlers ---

  const handleEditWLSalesEntry = useCallback((updatedEntry: WLSalesPlatformEntry) => {
    setTrackingData(prevData => {
        const updatedWLSales = prevData.wlSales.map(entry => 
            entry.id === updatedEntry.id ? updatedEntry : entry
        );
        
        // Recalculate only for the specific game and platform
        const finalWLSales = recalculateWLSales(updatedWLSales, updatedEntry.game, updatedEntry.platform);

        return {
            ...prevData,
            wlSales: finalWLSales,
        };
    });
    setEditingWLSalesEntry(null); // Close dialog
  }, [recalculateWLSales]);

  const handleAddWLSalesEntry = useCallback((newEntry: Omit<WLSalesPlatformEntry, 'date' | 'variation' | 'id'> & { date: string, saleType: SaleType, platform: Platform }) => {
    const dateObject = new Date(newEntry.date);
    
    setTrackingData(prevData => {
        const entryToAdd: WLSalesPlatformEntry = {
            ...newEntry,
            id: generateLocalUniqueId('wl'),
            date: dateObject,
            variation: 0, // Will be recalculated
        };
        
        const updatedWLSales = [...prevData.wlSales, entryToAdd];
        // Recalculate only for the specific game and platform
        const finalWLSales = recalculateWLSales(updatedWLSales, newEntry.game, newEntry.platform);

        return {
            ...prevData,
            wlSales: finalWLSales,
        };
    });
    
    setIsAddWLSalesFormOpen(false);
  }, [recalculateWLSales]);

  const handleDeleteWLSalesEntry = useCallback((id: string) => {
    setTrackingData(prevData => {
        const entryToDelete = prevData.wlSales.find(entry => entry.id === id);
        if (!entryToDelete) return prevData;

        const updatedWLSales = prevData.wlSales.filter(entry => entry.id !== id);
        
        // Recalculate variations for the affected game and platform
        const finalWLSales = recalculateWLSales(updatedWLSales, entryToDelete.game, entryToDelete.platform);
        
        return {
            ...prevData,
            wlSales: finalWLSales,
        };
    });
    toast.success("Entrada de Wishlist/Vendas removida com sucesso.");
  }, [recalculateWLSales]);

  const handleChartPointClick = useCallback((entry: WLSalesPlatformEntry) => {
    setEditingWLSalesEntry(entry);
  }, []);

  // --- Other Handlers ---
  
  const handleEditInfluencerEntry = useCallback((updatedEntry: InfluencerTrackingEntry) => {
    setTrackingData(prevData => ({
        ...prevData,
        influencerTracking: prevData.influencerTracking.map(entry => 
            entry.id === updatedEntry.id ? updatedEntry : entry
        ).sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0)),
    }));
  }, []);

  const handleDeleteInfluencerEntry = useCallback((id: string) => {
    setTrackingData(prevData => ({
      ...prevData,
      influencerTracking: prevData.influencerTracking.filter(entry => entry.id !== id),
    }));
    toast.success("Entrada de influencer removida com sucesso.");
  }, []);

  const handleAddInfluencerEntry = useCallback((newEntry: Omit<InfluencerTrackingEntry, 'id' | 'roi' | 'date'> & { date: string }) => {
    const dateObject = new Date(newEntry.date);
    const roiValue = newEntry.estimatedWL > 0 ? newEntry.investment / newEntry.estimatedWL : '-';
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

  const handleEditEventEntry = useCallback((updatedEntry: EventTrackingEntry) => {
    setTrackingData(prevData => ({
        ...prevData,
        eventTracking: prevData.eventTracking.map(entry => 
            entry.id === updatedEntry.id ? updatedEntry : entry
        ).sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)),
    }));
  }, []);

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
    const roiValue = newEntry.wlGenerated > 0 ? newEntry.cost / newEntry.wlGenerated : '-';
    const costPerViewValue = newEntry.views > 0 ? newEntry.cost / newEntry.views : '-';
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

  const handleEditPaidTrafficEntry = useCallback((updatedEntry: PaidTrafficEntry) => {
    setTrackingData(prevData => ({
        ...prevData,
        paidTraffic: prevData.paidTraffic.map(entry => 
            entry.id === updatedEntry.id ? updatedEntry : entry
        ).sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)),
    }));
  }, []);

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
    const networkConversion = newEntry.impressions > 0 ? newEntry.clicks / newEntry.impressions : 0;
    const estimatedCostPerWL = newEntry.estimatedWishlists > 0 ? newEntry.investedValue / newEntry.estimatedWishlists : '-';
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

  const handleUpdateWlDetails = useCallback((game: string, newDetails: Partial<WlDetails>) => {
    setTrackingData(prevData => {
        const updatedWlDetails = prevData.wlDetails.map(detail => {
            if (detail.game === game) {
                return { ...detail, ...newDetails };
            }
            return detail;
        });
        return { ...prevData, wlDetails: updatedWlDetails };
    });
  }, []);

  // Removendo a função de salvar URL do logo
  // const handleSaveLogoUrl = () => {
  //   if (newLogoUrl.trim() !== '') {
  //     setCurrentLogoUrl(newLogoUrl.trim());
  //     toast.success("URL do logo atualizada com sucesso!");
  //   } else {
  //     toast.error("Por favor, insira uma URL válida para o logo.");
  //   }
  //   setIsLogoEditDialogOpen(false);
  //   setNewLogoUrl(''); // Limpar o campo após salvar
  // };


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
    
    // Filter WL Sales by selected game AND platform
    const wlSales = trackingData.wlSales
        .filter(d => d.game.trim() === game)
        .filter(d => selectedPlatform === 'All' || d.platform === selectedPlatform)
        .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

    // 2. Recalculate Influencer Summary (unchanged by platform filter)
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


    // 3. KPI Calculations (based on ALL platforms for the game, except for WL/Sales which respects platform filter)
    const investmentSources = {
        influencers: influencerTracking.reduce((sum, item) => sum + item.investment, 0),
        events: eventTracking.reduce((sum, item) => sum + item.cost, 0),
        paidTraffic: paidTraffic.reduce((sum, item) => sum + item.investedValue, 0),
    };

    const totalInvestment = investmentSources.influencers + investmentSources.events + investmentSources.paidTraffic;

    const totalViews = 
        influencerTracking.reduce((sum, item) => sum + item.views, 0) +
        eventTracking.reduce((sum, item) => sum + item.views, 0) +
        paidTraffic.reduce((sum, item) => sum + item.impressions, 0);
    
    const totalWLGenerated = 
        influencerTracking.reduce((sum, item) => sum + item.estimatedWL, 0) +
        eventTracking.reduce((sum, item) => sum + item.wlGenerated, 0);
    
    // Total Sales and Wishlists (for Game Summary Panel) - based on filtered WL Sales
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
          investmentSources,
      }
    };
  }, [selectedGame, selectedPlatform, trackingData, recalculateWLSales]);

  // Renderização condicional para quando não há jogos
  if (trackingData.games.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <Card className="p-6">
                <h1 className="text-2xl font-bold mb-4">Dashboard de Rastreamento</h1>
                <p className="text-muted-foreground">Nenhum dado de rastreamento encontrado.</p>
                <Dialog open={isAddGameFormOpen} onOpenChange={setIsAddGameFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsAddGameFormOpen(true)} className="mt-4 bg-gogo-cyan hover:bg-gogo-cyan/90">
                            <Plus className="h-4 w-4 mr-2" /> Adicionar Primeiro Jogo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Jogo</DialogTitle>
                        </DialogHeader>
                        <AddGameForm 
                            onSave={handleAddGame} 
                            onClose={() => setIsAddGameFormOpen(false)} 
                        />
                    </DialogContent>
                </Dialog>
            </Card>
        </div>
    );
  }

  // Renderização principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-gogo-cyan/5 to-gogo-orange/5 dark:from-gray-950 dark:to-gray-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="flex items-center mb-4 sm:mb-0">
                {/* Removendo a imagem do logo e a funcionalidade de edição */}
                {/* <img src={currentLogoUrl} alt="Gogo Games Logo" className="h-14 w-auto mr-4 object-contain" /> */}
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">
                    Gogo Games Dashboard
                </h1>
                {/* Removendo o botão de edição do logo */}
                {/* <Dialog open={isLogoEditDialogOpen} onOpenChange={setIsLogoEditDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-gogo-cyan">
                            <ImageIcon className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Editar URL do Logo</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="logo-url" className="text-right">
                                    URL
                                </Label>
                                <Input
                                    id="logo-url"
                                    defaultValue={currentLogoUrl}
                                    onChange={(e) => setNewLogoUrl(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsLogoEditDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveLogoUrl} className="bg-gogo-cyan hover:bg-gogo-cyan/90">Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog> */}
            </div>
            <div className="flex items-center gap-4">
                <label htmlFor="game-select" className="font-semibold text-lg text-gray-700 dark:text-gray-200">Jogo:</label>
                <Select onValueChange={setSelectedGame} defaultValue={selectedGame}>
                    <SelectTrigger id="game-select" className="w-full md:w-[200px] bg-background">
                        <SelectValue placeholder="Selecione um jogo" />
                    </SelectTrigger>
                    <SelectContent>
                        {trackingData.games.map(game => (
                            <SelectItem key={game} value={game}>{game}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                
                <Dialog open={isAddGameFormOpen} onOpenChange={setIsAddGameFormOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-gogo-orange hover:bg-gogo-orange/90 text-white">
                            <Plus className="h-4 w-4 mr-2" /> Novo Jogo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Jogo</DialogTitle>
                        </DialogHeader>
                        <AddGameForm 
                            onSave={handleAddGame} 
                            onClose={() => setIsAddGameFormOpen(false)} 
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </header>

        {filteredData && (
            <>
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="flex w-full overflow-x-auto whitespace-nowrap border-b bg-white dark:bg-gray-800 text-muted-foreground rounded-t-lg p-0 h-auto">
                        <TabsTrigger value="overview" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-sm">Visão Geral</TabsTrigger>
                        <TabsTrigger value="wl-sales" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-sm">Wishlists</TabsTrigger>
                        <TabsTrigger value="comparisons" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-sm">Comparações</TabsTrigger>
                        <TabsTrigger value="influencers" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-sm">Influencers</TabsTrigger>
                        <TabsTrigger value="events" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-sm">Eventos</TabsTrigger>
                        <TabsTrigger value="paid-traffic" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-sm">Tráfego Pago</TabsTrigger>
                        <TabsTrigger value="demo" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-sm">Demo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 mt-4 p-4 bg-white dark:bg-gray-800 rounded-b-lg shadow-md">
                        <GameSummaryPanel 
                            gameName={selectedGame}
                            totalSales={filteredData.kpis.totalSales}
                            totalWishlists={filteredData.kpis.totalWishlists}
                            totalInvestment={filteredData.kpis.totalInvestment}
                            investmentSources={filteredData.kpis.investmentSources}
                        />
                        <div className="grid gap-4 md:grid-cols-3">
                            <KpiCard title="Investimento Total" value={formatCurrency(filteredData.kpis.totalInvestment)} icon={<DollarSign className="h-4 w-4 text-gogo-orange" />} />
                            <KpiCard title="Views + Impressões" value={formatNumber(filteredData.kpis.totalViews)} icon={<Eye className="h-4 w-4 text-gogo-cyan" />} />
                            <KpiCard title="Wishlists Geradas (Est.)" value={formatNumber(filteredData.kpis.totalWLGenerated)} description="Estimativa baseada em ações de marketing." icon={<List className="h-4 w-4 text-gogo-orange" />} />
                        </div>
                        <ResultSummaryPanel data={filteredData.resultSummary} />
                    </TabsContent>

                    <TabsContent value="wl-sales" className="space-y-6 mt-4 p-4 bg-white dark:bg-gray-800 rounded-b-lg shadow-md">
                        <Card className="bg-muted/50 dark:bg-gray-700 border-none shadow-none">
                            <CardContent className="flex flex-col md:flex-row items-center gap-4 p-4">
                                <label htmlFor="platform-select" className="font-semibold text-md min-w-[150px] text-gray-700 dark:text-gray-200">Filtrar por Plataforma:</label>
                                <Select onValueChange={(value: Platform | 'All') => setSelectedPlatform(value)} defaultValue={selectedPlatform}>
                                    <SelectTrigger id="platform-select" className="w-full md:w-[200px] bg-background">
                                        <SelectValue placeholder="Todas as Plataformas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">Todas as Plataformas</SelectItem>
                                        {ALL_PLATFORMS.map(platform => (
                                            <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end mb-4 space-x-2">
                            <Button variant="outline" size="sm" onClick={() => setIsHistoryVisible(!isHistoryVisible)} className="text-gogo-cyan border-gogo-cyan hover:bg-gogo-cyan/10">
                                {isHistoryVisible ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                {isHistoryVisible ? 'Ocultar Histórico' : 'Mostrar Histórico'}
                            </Button>
                            <ExportDataButton 
                                data={filteredData.wlSales} 
                                filename={`${selectedGame}_${selectedPlatform}_WL_Vendas.csv`} 
                                label="WL/Vendas"
                            />
                            <Dialog open={isAddWLSalesFormOpen} onOpenChange={setIsAddWLSalesFormOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setIsAddWLSalesFormOpen(true)} className="bg-gogo-cyan hover:bg-gogo-cyan/90 text-white">
                                        <Plus className="h-4 w-4 mr-2" /> Adicionar WL/Venda
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px]">
                                    <DialogHeader>
                                        <DialogTitle>Adicionar Entrada Diária de Wishlist/Vendas</DialogTitle>
                                    </DialogHeader>
                                    <AddWLSalesForm 
                                        games={trackingData.games} 
                                        onSave={handleAddWLSalesEntry} 
                                        onClose={() => setIsAddWLSalesFormOpen(false)} 
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <WLSalesChartPanel data={filteredData.wlSales} onPointClick={handleChartPointClick} />
                        <SalesByTypeChart data={filteredData.wlSales} />
                        {isHistoryVisible && (
                            <WLSalesTablePanel 
                                data={filteredData.wlSales} 
                                onDelete={handleDeleteWLSalesEntry} 
                                onEdit={handleEditWLSalesEntry}
                                games={trackingData.games}
                            />
                        )}
                        {selectedPlatform === 'Steam' && filteredData.wlDetails && (
                            <WlDetailsManager 
                                details={filteredData.wlDetails} 
                                gameName={selectedGame}
                                onUpdateDetails={handleUpdateWlDetails}
                            />
                        )}
                    </TabsContent>

                    {/* New Comparisons Tab Content */}
                    <TabsContent value="comparisons" className="space-y-6 mt-4 p-4 bg-white dark:bg-gray-800 rounded-b-lg shadow-md">
                        <WlComparisonsPanel data={filteredData.wlSales} allPlatforms={ALL_PLATFORMS} />
                    </TabsContent>

                    <TabsContent value="influencers" className="space-y-6 mt-4 p-4 bg-white dark:bg-gray-800 rounded-b-lg shadow-md">
                        <div className="flex justify-end mb-4 space-x-2">
                            <ExportDataButton 
                                data={filteredData.influencerTracking} 
                                filename={`${selectedGame}_Influencers_Tracking.csv`} 
                                label="Tracking Detalhado"
                            />
                            <Dialog open={isAddInfluencerFormOpen} onOpenChange={setIsAddInfluencerFormOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setIsAddInfluencerFormOpen(true)} className="bg-gogo-cyan hover:bg-gogo-cyan/90 text-white">
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
                            onEditTracking={handleEditInfluencerEntry}
                            games={trackingData.games}
                        />
                    </TabsContent>

                    <TabsContent value="events" className="space-y-6 mt-4 p-4 bg-white dark:bg-gray-800 rounded-b-lg shadow-md">
                        <div className="flex justify-end mb-4 space-x-2">
                            <ExportDataButton 
                                data={filteredData.eventTracking} 
                                filename={`${selectedGame}_Eventos_Tracking.csv`} 
                                label="Eventos"
                            />
                            <Dialog open={isAddEventFormOpen} onOpenChange={setIsAddEventFormOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setIsAddEventFormOpen(true)} className="bg-gogo-cyan hover:bg-gogo-cyan/90 text-white">
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
                        <EventPanel 
                            data={filteredData.eventTracking} 
                            onDeleteTracking={handleDeleteEventEntry} 
                            onEditTracking={handleEditEventEntry}
                            games={trackingData.games}
                        />
                    </TabsContent>

                    <TabsContent value="paid-traffic" className="space-y-6 mt-4 p-4 bg-white dark:bg-gray-800 rounded-b-lg shadow-md">
                        <div className="flex justify-end mb-4 space-x-2">
                            <ExportDataButton 
                                data={filteredData.paidTraffic} 
                                filename={`${selectedGame}_Trafego_Pago.csv`} 
                                label="Tráfego Pago"
                            />
                            <Dialog open={isAddPaidTrafficFormOpen} onOpenChange={setIsAddPaidTrafficFormOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setIsAddPaidTrafficFormOpen(true)} className="bg-gogo-cyan hover:bg-gogo-cyan/90 text-white">
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
                        <PaidTrafficPanel 
                            data={filteredData.paidTraffic} 
                            onDeleteTracking={handleDeletePaidTrafficEntry} 
                            onEditTracking={handleEditPaidTrafficEntry}
                            games={trackingData.games}
                        />
                    </TabsContent>

                    <TabsContent value="demo" className="space-y-6 mt-4 p-4 bg-white dark:bg-gray-800 rounded-b-lg shadow-md">
                        <div className="flex justify-end mb-4 space-x-2">
                            <ExportDataButton 
                                data={filteredData.demoTracking} 
                                filename={`${selectedGame}_Demo_Tracking.csv`} 
                                label="Demo Tracking"
                            />
                        </div>
                        <DemoTrackingPanel data={filteredData.demoTracking} />
                    </TabsContent>
                </Tabs>

                <Dialog open={!!editingWLSalesEntry} onOpenChange={(open) => !open && setEditingWLSalesEntry(null)}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Editar Entrada de WL/Vendas</DialogTitle>
                        </DialogHeader>
                        {editingWLSalesEntry && (
                            <EditWLSalesForm 
                                games={trackingData.games}
                                entry={editingWLSalesEntry}
                                onSave={handleEditWLSalesEntry}
                                onClose={() => setEditingWLSalesEntry(null)}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;