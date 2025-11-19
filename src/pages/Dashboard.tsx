"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { getTrackingData, InfluencerTrackingEntry, InfluencerSummaryEntry, EventTrackingEntry, PaidTrafficEntry, DemoTrackingEntry, WLSalesPlatformEntry, ResultSummaryEntry, WlDetails, SaleType, Platform } from '@/data/trackingData';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Eye, List, Plus, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; 
import { Label } from '@/components/ui/label';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

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
import WlComparisonsPanel from '@/components/dashboard/WlComparisonsPanel';

// Initialize data once
const initialData = getTrackingData();

// Helper to generate unique IDs locally
let localIdCounter = initialData.influencerTracking.length + initialData.eventTracking.length + initialData.paidTraffic.length + initialData.wlSales.length;
const generateLocalUniqueId = (prefix: string = 'track') => `${prefix}-${localIdCounter++}`;

const ALL_PLATFORMS: Platform[] = ['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Android', 'iOS', 'Epic Games', 'Outra'];

const Dashboard = () => {
  const [trackingData, setTrackingData] = useState(initialData);
  const [selectedGame, setSelectedGame] = useState<string>(trackingData.games[0] || '');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'All'>('All');
  const [activeTab, setActiveTab] = useState("overview");
  
  const [isAddInfluencerFormOpen, setIsAddInfluencerFormOpen] = useState(false);
  const [isAddEventFormOpen, setIsAddEventFormOpen] = useState(false);
  const [isAddPaidTrafficFormOpen, setIsAddPaidTrafficFormOpen] = useState(false);
  const [isAddWLSalesFormOpen, setIsAddWLSalesFormOpen] = useState(false);
  const [isAddGameFormOpen, setIsAddGameFormOpen] = useState(false);
  const [editingWLSalesEntry, setEditingWLSalesEntry] = useState<WLSalesPlatformEntry | null>(null);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);

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

  const handleAddGame = useCallback((gameName: string) => {
    if (trackingData.games.includes(gameName)) {
        toast.error(`O jogo "${gameName}" já existe.`);
        return;
    }
    setTrackingData(prevData => ({
        ...prevData,
        games: [...prevData.games, gameName].sort(),
        wlDetails: [...prevData.wlDetails, { game: gameName, reviews: [], bundles: [], traffic: [] }],
    }));
    setSelectedGame(gameName);
    toast.success(`Jogo "${gameName}" adicionado com sucesso!`);
  }, [trackingData.games]);

  const handleEditWLSalesEntry = useCallback((updatedEntry: WLSalesPlatformEntry) => {
    setTrackingData(prevData => {
        const updatedWLSales = prevData.wlSales.map(entry => 
            entry.id === updatedEntry.id ? updatedEntry : entry
        );
        const finalWLSales = recalculateWLSales(updatedWLSales, updatedEntry.game, updatedEntry.platform);
        return {
            ...prevData,
            wlSales: finalWLSales,
        };
    });
    setEditingWLSalesEntry(null);
  }, [recalculateWLSales]);

  const handleAddWLSalesEntry = useCallback((newEntry: Omit<WLSalesPlatformEntry, 'date' | 'variation' | 'id'> & { date: string, saleType: SaleType, platform: Platform }) => {
    const dateObject = new Date(newEntry.date);
    setTrackingData(prevData => {
        const entryToAdd: WLSalesPlatformEntry = {
            ...newEntry,
            id: generateLocalUniqueId('wl'),
            date: dateObject,
            variation: 0,
        };
        const updatedWLSales = [...prevData.wlSales, entryToAdd];
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


  const filteredData = useMemo(() => {
    if (!selectedGame) return null;
    
    const game = selectedGame.trim();

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
    
    const wlSales = trackingData.wlSales
        .filter(d => d.game.trim() === game)
        .filter(d => selectedPlatform === 'All' || d.platform === selectedPlatform)
        .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

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

  if (trackingData.games.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background text-foreground">
            <Card className="p-6 shadow-xl border border-border">
                <h1 className="text-2xl font-bold mb-4 text-gogo-cyan">Dashboard de Rastreamento</h1>
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

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans">
      <h1>Dashboard is working!</h1>
    </div>
  );
};

export default Dashboard;