"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { getTrackingData, InfluencerTrackingEntry, InfluencerSummaryEntry, EventTrackingEntry, PaidTrafficEntry, DemoTrackingEntry, WLSalesPlatformEntry, ResultSummaryEntry, WlDetails, SaleType, Platform, ManualEventMarker, TrafficEntry, TrackingData } from '@/data/trackingData';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Eye, List, Plus, EyeOff, Megaphone, CalendarPlus, Palette, Bot, History } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
import { getGames, addGame as addGameToSupabase, updateGame as updateGameInSupabase, deleteGame as deleteGameFromSupabase, Game as SupabaseGame } from '@/integrations/supabase/games';
import { rawData } from '@/data/rawTrackingData'; // Import rawData

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
import { formatCurrency, formatNumber, convertToCSV } from '@/lib/utils'; // Import convertToCSV
import AddGameForm from '@/components/dashboard/AddGameForm';
import WlComparisonsPanel from '@/components/dashboard/WlComparisonsPanel';
import AddDemoForm from '@/components/dashboard/AddDemoForm';
import EditDemoForm from '@/components/dashboard/EditDemoForm';
import ManualEventMarkerForm from '@/components/dashboard/ManualEventMarkerForm'; 
import WLSalesActionMenu from '@/components/dashboard/WLSalesActionMenu'; 
import WlConversionKpisPanel, { TimeFrame } from '@/components/dashboard/WlConversionKpisPanel'; // Import TimeFrame
import AddTrafficForm from '@/components/dashboard/AddTrafficForm'; 
import AIDataProcessor from '@/components/dashboard/AIDataProcessor'; // NEW IMPORT
import AddGameModal from '@/components/dashboard/AddGameModal'; // NEW IMPORT
import DeleteGameButton from '@/components/dashboard/DeleteGameButton'; // NEW IMPORT
import { addDays, isBefore, isEqual, startOfDay, subDays } from 'date-fns';
import { Input } from '@/components/ui/input';

// Initialize data once
const initialRawData = getTrackingData();

// Helper to generate unique IDs locally
let localIdCounter = initialRawData.influencerTracking.length + initialRawData.eventTracking.length + initialRawData.paidTraffic.length + initialRawData.wlSales.length + initialRawData.demoTracking.length + initialRawData.manualEventMarkers.length + initialRawData.trafficTracking.length;
const generateLocalUniqueId = (prefix: string = 'track') => `${prefix}-${localIdCounter++}`;

const ALL_PLATFORMS: Platform[] = ['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Android', 'iOS', 'Epic Games', 'Outra'];

// Tipos para as configurações de cor
interface WLSalesChartColors {
    daily: string;
    weekly: string;
    monthly: string;
    event: string;
    sales: string;
}

const defaultChartColors: WLSalesChartColors = {
    daily: '#00BFFF', // Gogo Cyan (Azul)
    weekly: '#10B981', // Emerald 500 (Verde)
    monthly: '#8B5CF6', // Violet 500 (Roxo)
    event: '#FF6600', // Gogo Orange (Laranja)
    sales: '#EF4444', // Red 500 (Vermelho)
};

const Dashboard = () => {
  const [trackingData, setTrackingData] = useState(initialRawData);
  const [selectedGameName, setSelectedGameName] = useState<string>(trackingData.games[0] || '');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'All'>('All');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('weekly'); 
  const [selectedTab, setSelectedTab] = useState('overview'); 
  
  const [isAddInfluencerFormOpen, setIsAddInfluencerFormOpen] = useState(false);
  const [isAddEventFormOpen, setIsAddEventFormOpen] = useState(false);
  const [isAddPaidTrafficFormOpen, setIsAddPaidTrafficFormOpen] = useState(false);
  const [isAddWLSalesFormOpen, setIsAddWLSalesFormOpen] = useState(false);
  const [isAddGameFormOpen, setIsAddGameFormOpen] = useState(false);
  const [isAddDemoFormOpen, setIsAddDemoFormOpen] = useState(false);
  const [isColorConfigOpen, setIsColorConfigOpen] = useState(false); 
  const [chartColors, setChartColors] = useState<WLSalesChartColors>(defaultChartColors); // INICIALIZAÇÃO CORRIGIDA
  
  const [clickedWLSalesEntry, setClickedWLSalesEntry] = useState<WLSalesPlatformEntry | null>(null);
  const [editingDemoEntry, setEditingDemoEntry] = useState<DemoTrackingEntry | null>(null);
  
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const [isAIDataProcessorOpen, setIsAIDataProcessorOpen] = useState(false); // NEW STATE

  // Fetch games from Supabase
  const { data: supabaseGames, refetch: refetchSupabaseGames } = useQuery<SupabaseGame[], Error>({
    queryKey: ['supabaseGames'],
    queryFn: getGames,
    initialData: [],
  });

  // Combine local games with Supabase games, prioritizing Supabase for launch dates and price
  const allAvailableGames = useMemo(() => {
    const combinedGamesMap = new Map<string, SupabaseGame>();
    
    // Add games from Supabase
    supabaseGames.forEach(game => {
      combinedGamesMap.set(game.name, game);
    });

    // Add games from local data if not already in Supabase, without launch_date/price/image
    trackingData.games.forEach(gameName => {
      if (!combinedGamesMap.has(gameName)) {
        // Assign a temporary local ID if not in Supabase
        combinedGamesMap.set(gameName, { id: generateLocalUniqueId('game'), name: gameName, launch_date: null, suggested_price: null, capsule_image_url: null, created_at: new Date().toISOString() });
      }
    });

    return Array.from(combinedGamesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [supabaseGames, trackingData.games]);

  // Set initial selected game based on combined list
  React.useEffect(() => {
    if (allAvailableGames.length > 0 && !selectedGameName) {
      setSelectedGameName(allAvailableGames[0].name);
    } else if (allAvailableGames.length > 0 && !allAvailableGames.some(g => g.name === selectedGameName)) {
      // If the previously selected game is no longer in the list (e.g., deleted), select the first one
      setSelectedGameName(allAvailableGames[0].name);
    }
  }, [allAvailableGames, selectedGameName]);

  const selectedGame = useMemo(() => {
    return allAvailableGames.find(game => game.name === selectedGameName);
  }, [allAvailableGames, selectedGameName]);


  // Função auxiliar para recalcular variações de WL
  const recalculateWLSales = useCallback((wlSales: WLSalesPlatformEntry[], game: string, platform: Platform): WLSalesPlatformEntry[] => {
    // Filter only real entries for calculation
    const gamePlatformEntries = wlSales
        .filter(e => e.game === game && e.platform === platform && !e.isPlaceholder)
        .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
        
    const otherEntries = wlSales.filter(e => e.game !== game || e.platform !== platform || e.isPlaceholder);

    let lastWL = 0;
    const recalculatedGamePlatformEntries = gamePlatformEntries.map(entry => {
        const currentWL = entry.wishlists;
        const currentVariation = currentWL - lastWL;
        lastWL = currentWL;
        return { ...entry, variation: currentVariation };
    });

    // Recombine real entries with placeholders (placeholders should not have their variation recalculated here)
    return [...otherEntries, ...recalculatedGamePlatformEntries].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
  }, []);

  // --- Game Management Handlers ---
  const handleAddGame = useCallback(async (gameName: string, launchDate: string | null, suggestedPrice: number, capsuleImageUrl: string | null) => {
    if (allAvailableGames.some(g => g.name === gameName)) {
        toast.error(`O jogo "${gameName}" já existe.`);
        return;
    }
    try {
        // Pass capsuleImageUrl to addGameToSupabase
        await addGameToSupabase(gameName, launchDate, suggestedPrice, capsuleImageUrl);
        refetchSupabaseGames(); // Refresh games from Supabase
        toast.success(`Jogo "${gameName}" adicionado com sucesso!`);
        setSelectedGameName(gameName);
    } catch (error) {
        console.error("Error adding game:", error);
        toast.error("Falha ao adicionar jogo.");
    }
  }, [allAvailableGames, refetchSupabaseGames]);

  const handleUpdateLaunchDate = useCallback(async (gameId: string, launchDate: string | null) => {
    try {
        // Check if the game exists in Supabase by its ID
        const gameInSupabase = supabaseGames.find(g => g.id === gameId);

        if (!gameInSupabase) {
            // If the game is not in Supabase (it has a local ID), add it first
            // We use selectedGameName here because gameId might be a local ID
            await addGameToSupabase(selectedGameName, launchDate, selectedGame?.suggested_price || null, selectedGame?.capsule_image_url || null);
            toast.success(`Jogo "${selectedGameName}" adicionado ao Supabase com data de lançamento.`);
        } else {
            // If the game exists in Supabase, just update its launch date
            await updateGameInSupabase(gameId, { launch_date: launchDate });
            toast.success(`Data de lançamento para "${selectedGameName}" atualizada.`);
        }
        refetchSupabaseGames(); // Always refetch to ensure UI is in sync
    } catch (error) {
        console.error("Error updating launch date:", error);
        toast.error("Falha ao atualizar data de lançamento.");
    }
  }, [refetchSupabaseGames, supabaseGames, selectedGameName, selectedGame?.suggested_price, selectedGame?.capsule_image_url]);

  const handleDeleteGame = useCallback(async (gameId: string) => {
    const gameToDelete = allAvailableGames.find(g => g.id === gameId);
    if (!gameToDelete) return;

    try {
        // 1. Delete from Supabase if it has a real ID
        if (!gameId.startsWith('game-')) { // Assuming local IDs start with 'game-'
            await deleteGameFromSupabase(gameId);
        }
        
        // 2. Remove from local tracking data (all entries associated with this game name)
        setTrackingData(prevData => {
            const gameName = gameToDelete.name;
            return {
                ...prevData,
                games: prevData.games.filter(name => name !== gameName),
                influencerTracking: prevData.influencerTracking.filter(e => e.game !== gameName),
                eventTracking: prevData.eventTracking.filter(e => e.game !== gameName),
                paidTraffic: prevData.paidTraffic.filter(e => e.game !== gameName),
                demoTracking: prevData.demoTracking.filter(e => e.game !== gameName),
                wlSales: prevData.wlSales.filter(e => e.game !== gameName),
                trafficTracking: prevData.trafficTracking.filter(e => e.game !== gameName),
                resultSummary: prevData.resultSummary.filter(e => e.game !== gameName),
                wlDetails: prevData.wlDetails.filter(e => e.game !== gameName),
                manualEventMarkers: prevData.manualEventMarkers.filter(e => e.game !== gameName),
            };
        });

        // 3. Refetch Supabase games and update selected game
        refetchSupabaseGames();
        setSelectedGameName(allAvailableGames.filter(g => g.id !== gameId)[0]?.name || '');
        
        toast.success(`Jogo "${gameToDelete.name}" excluído com sucesso.`);
    } catch (error) {
        console.error("Error deleting game:", error);
        toast.error("Falha ao excluir jogo.");
    }
  }, [allAvailableGames, refetchSupabaseGames]);


  // --- AI Data Processing Handler ---
  const handleAIDataProcessed = useCallback((structuredData: any) => {
    setTrackingData(prevData => {
        const gameName = selectedGameName;
        const newTrackingData = { ...prevData };

        // Helper to process arrays, convert dates, and assign IDs
        const processArray = (key: keyof TrackingData, prefix: string, data: any[]) => {
            if (!Array.isArray(data)) return;

            const processedData = data.map(item => {
                const newItem = { ...item, id: generateLocalUniqueId(prefix), game: gameName };
                
                // Convert date strings back to Date objects
                if (item.date && typeof item.date === 'string') {
                    newItem.date = startOfDay(new Date(item.date));
                }
                if (item.startDate && typeof item.startDate === 'string') {
                    newItem.startDate = startOfDay(new Date(item.startDate));
                }
                if (item.endDate && typeof item.endDate === 'string') {
                    newItem.endDate = startOfDay(new Date(item.endDate));
                }
                
                return newItem;
            }).filter(item => item.game === gameName); // Ensure data belongs to the current game

            // Merge new data, ensuring WL Sales recalculation if needed
            if (key === 'wlSales') {
                // Filter out existing WL entries for the current game/platform before merging
                const existingWLSalesForOtherGames = prevData.wlSales.filter(e => e.game !== gameName);
                const existingWLSalesForCurrentGame = prevData.wlSales.filter(e => e.game === gameName);
                
                // Merge new AI data with existing data for the current game
                const updatedWLSalesForCurrentGame = [...existingWLSalesForCurrentGame, ...processedData];
                
                // Identify platforms affected by the new data
                const platformsAffected = new Set(processedData.map(d => d.platform || 'Steam'));
                
                let finalWLSales = [...existingWLSalesForOtherGames];
                
                // Recalculate variations for all affected platforms in the current game
                platformsAffected.forEach(platform => {
                    const entriesForPlatform = updatedWLSalesForCurrentGame.filter(e => e.platform === platform);
                    const recalculatedEntries = recalculateWLSales(entriesForPlatform, gameName, platform as Platform);
                    finalWLSales = finalWLSales.filter(e => e.game !== gameName || e.platform !== platform).concat(recalculatedEntries);
                });
                
                newTrackingData.wlSales = finalWLSales;
            } else {
                // For other types, merge and replace existing entries for the current game
                const existingEntries = prevData[key].filter((e: any) => e.game !== gameName);
                newTrackingData[key] = [...existingEntries, ...processedData];
            }
        };

        // Process each type of data returned by the AI
        processArray('influencerTracking', 'ai-inf', structuredData.influencerTracking || []);
        processArray('eventTracking', 'ai-evt', structuredData.eventTracking || []);
        processArray('paidTraffic', 'ai-paid', structuredData.paidTraffic || []);
        processArray('wlSales', 'ai-wl', structuredData.wlSales || []);
        processArray('demoTracking', 'ai-demo', structuredData.demoTracking || []);
        processArray('trafficTracking', 'ai-traffic', structuredData.trafficTracking || []);
        processArray('manualEventMarkers', 'ai-marker', structuredData.manualEventMarkers || []);

        return newTrackingData;
    });
  }, [selectedGameName, recalculateWLSales]);


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
    setClickedWLSalesEntry(null); // Close dialog
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
    // Set the clicked entry to open the action menu dialog
    setClickedWLSalesEntry(entry);
  }, []);

  // --- Manual Event Marker Handlers ---
  
  const handleSaveManualMarker = useCallback((values: { date: string, name: string }) => {
    const dateObject = startOfDay(new Date(values.date));
    
    // Check if a marker already exists for this date/game
    const existingMarker = trackingData.manualEventMarkers.find(m => 
        m.game === selectedGameName && startOfDay(m.date).getTime() === dateObject.getTime()
    );

    if (existingMarker) {
        // Update existing marker
        setTrackingData(prevData => ({
            ...prevData,
            manualEventMarkers: prevData.manualEventMarkers.map(m => 
                m.id === existingMarker.id ? { ...m, name: values.name } : m
            ),
        }));
    } else {
        // Add new marker
        const newMarker: ManualEventMarker = {
            id: generateLocalUniqueId('manual-event'),
            game: selectedGameName,
            date: dateObject,
            name: values.name,
        };
        setTrackingData(prevData => ({
            ...prevData,
            manualEventMarkers: [...prevData.manualEventMarkers, newMarker],
        }));
    }
    setClickedWLSalesEntry(null); // Close the action menu
  }, [selectedGameName, trackingData.manualEventMarkers]);

  const handleDeleteManualMarker = useCallback((id: string) => {
    setTrackingData(prevData => ({
        ...prevData,
        manualEventMarkers: prevData.manualEventMarkers.filter(m => m.id !== id),
    }));
    setClickedWLSalesEntry(null); // Close the action menu
  }, []);


  // --- Influencer Handlers ---
  
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

  // --- Event Handlers ---

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

  // --- Paid Traffic Handlers ---

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

  // --- WL Details Handlers ---

  const handleUpdateWlDetails = useCallback((game: string, newDetails: Partial<WlDetails>) => {
    setTrackingData(prevData => {
        const updatedWlDetails = prevData.wlDetails.map(detail => {
            if (detail.game === game) {
                return { ...detail, ...newDetails };
            }
            return detail;
        });
        // If details for this game don't exist, create a new entry
        if (!updatedWlDetails.some(d => d.game === game)) {
            updatedWlDetails.push({ game, reviews: [], bundles: [], traffic: [], ...newDetails });
        }
        return { ...prevData, wlDetails: updatedWlDetails };
    });
  }, []);

  // --- Demo Tracking Handlers ---
  const handleAddDemoEntry = useCallback((newEntry: Omit<DemoTrackingEntry, 'id' | 'date'> & { date: string }) => {
    const dateObject = new Date(newEntry.date);
    const entryToAdd: DemoTrackingEntry = {
        ...newEntry,
        id: generateLocalUniqueId('demo'),
        game: selectedGameName, // Associate with the currently selected game
        date: dateObject,
    };
    setTrackingData(prevData => ({
        ...prevData,
        demoTracking: [...prevData.demoTracking, entryToAdd].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0)),
    }));
    setIsAddDemoFormOpen(false);
    toast.success("Entrada de Demo Tracking adicionada.");
  }, [selectedGameName]);

  const handleEditDemoEntry = useCallback((updatedEntry: DemoTrackingEntry) => {
    setTrackingData(prevData => ({
        ...prevData,
        demoTracking: prevData.demoTracking.map(entry => 
            entry.id === updatedEntry.id ? updatedEntry : entry
        ).sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0)),
    }));
    setEditingDemoEntry(null); // Close dialog
    toast.success("Entrada de Demo Tracking atualizada.");
  }, []);

  const handleDeleteDemoEntry = useCallback((id: string) => {
    setTrackingData(prevData => ({
      ...prevData,
      demoTracking: prevData.demoTracking.filter(entry => entry.id !== id),
    }));
    toast.success("Entrada de Demo Tracking removida com sucesso.");
  }, []);

  // --- Traffic Tracking Handlers ---
  const handleAddTrafficEntry = useCallback((newEntry: { game: string, platform: Platform, source: string, startDate: string, endDate: string, visits: number, impressions?: number, clicks?: number }) => {
    const entryToAdd: TrafficEntry = {
        id: generateLocalUniqueId('traffic'),
        game: newEntry.game,
        platform: newEntry.platform,
        source: newEntry.source,
        startDate: new Date(newEntry.startDate),
        endDate: new Date(newEntry.endDate),
        visits: newEntry.visits,
        impressions: newEntry.impressions || 0,
        clicks: newEntry.clicks || 0,
    };
    setTrackingData(prevData => ({
        ...prevData,
        trafficTracking: [...prevData.trafficTracking, entryToAdd].sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)),
    }));
    toast.success("Entrada de tráfego/visitas adicionada.");
  }, []);

  // --- Backup/Restore Handlers (Updated) ---
  
  const handleCreateBackup = useCallback(() => {
    try {
        // Create a snapshot object containing all current tracking data
        const snapshot = {
            influencerTracking: trackingData.influencerTracking,
            influencerSummary: trackingData.influencerSummary,
            eventTracking: trackingData.eventTracking,
            paidTraffic: trackingData.paidTraffic,
            demoTracking: trackingData.demoTracking,
            wlSales: trackingData.wlSales,
            trafficTracking: trackingData.trafficTracking,
            resultSummary: trackingData.resultSummary,
            wlDetails: trackingData.wlDetails,
            manualEventMarkers: trackingData.manualEventMarkers,
            supabaseGames: supabaseGames,
        };

        const jsonString = JSON.stringify(snapshot, (key, value) => {
            // Custom replacer to convert Date objects to ISO strings
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        }, 2);
        
        // Trigger download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const date = new Date().toISOString().split('T')[0];
        const filename = `gogo_tracking_snapshot_${date}.json`;
        
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        toast.success(`Snapshot salvo como ${filename}`);
    } catch (error) {
        console.error("Snapshot failed:", error);
        toast.error("Falha ao criar o snapshot.");
    }
  }, [trackingData, supabaseGames]);

  const handleRestoreBackup = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const snapshot = JSON.parse(content);

            // Function to convert ISO strings back to Date objects
            const reviveDates = (obj: any): any => {
                if (typeof obj === 'object' && obj !== null) {
                    for (const key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            const value = obj[key];
                            if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)) {
                                obj[key] = new Date(value);
                            } else if (typeof value === 'object' && value !== null) {
                                obj[key] = reviveDates(value);
                            }
                        }
                    }
                }
                return obj;
            };

            const restoredData = reviveDates(snapshot);

            // Update local tracking data state
            setTrackingData({
                games: restoredData.games || trackingData.games, // Keep existing game list structure if not present
                influencerTracking: restoredData.influencerTracking || [],
                influencerSummary: restoredData.influencerSummary || [],
                eventTracking: restoredData.eventTracking || [],
                paidTraffic: restoredData.paidTraffic || [],
                demoTracking: restoredData.demoTracking || [],
                wlSales: restoredData.wlSales || [],
                trafficTracking: restoredData.trafficTracking || [],
                resultSummary: restoredData.resultSummary || [],
                wlDetails: restoredData.wlDetails || [],
                manualEventMarkers: restoredData.manualEventMarkers || [],
            });
            
            // Note: Supabase games are managed by react-query and should be refreshed separately if needed, 
            // but for local state integrity, we rely on the local tracking data.

            toast.success("Estado restaurado com sucesso! Use o botão 'Refresh' se o preview não atualizar.");
            // Clear the file input value to allow restoring the same file again
            event.target.value = ''; 
        } catch (error) {
            console.error("Restore failed:", error);
            toast.error("Falha ao restaurar o snapshot. Verifique se o arquivo é um JSON válido.");
        }
    };
    reader.readAsText(file);
  }, [trackingData.games]);


  const filteredData = useMemo(() => {
    if (!selectedGameName) return null;
    
    const gameName = selectedGameName.trim();
    const gameId = selectedGame?.id || '';
    const launchDate = selectedGame?.launch_date ? new Date(selectedGame.launch_date) : null;
    const suggestedPrice = selectedGame?.suggested_price || 19.99; // Use suggested price
    const capsuleImageUrl = selectedGame?.capsule_image_url || null; // NEW: Get capsule image URL

    // 1. Filter and enhance data, recalculating dynamic fields
    const influencerTracking = trackingData.influencerTracking
        .filter(d => d.game.trim() === gameName)
        .map(item => ({
            ...item,
            roi: item.estimatedWL > 0 ? item.investment / item.estimatedWL : '-',
        }));
    
    const eventTracking = trackingData.eventTracking
        .filter(d => d.game.trim() === gameName)
        .map(item => ({
            ...item,
            roi: item.wlGenerated > 0 ? item.cost / item.wlGenerated : '-',
            costPerView: item.views > 0 ? item.cost / item.views : '-',
        }));

    const paidTraffic = trackingData.paidTraffic
        .filter(d => d.game.trim() === gameName)
        .map(item => ({
            ...item,
            networkConversion: item.impressions > 0 ? item.clicks / item.impressions : 0,
            estimatedCostPerWL: item.estimatedWishlists > 0 ? item.investedValue / item.estimatedWishlists : '-',
        }));
    
    // Filter real WL Sales by selected game AND platform
    const realWLSales = trackingData.wlSales
        .filter(d => d.game.trim() === gameName)
        .filter(d => selectedPlatform === 'All' || d.platform === selectedPlatform)
        .filter(d => !d.isPlaceholder)
        .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

    // Filter manual markers for the current game
    const manualEventMarkers = trackingData.manualEventMarkers
        .filter(m => m.game.trim() === gameName);

    // Filter manual traffic tracking
    const trafficTracking = trackingData.trafficTracking
        .filter(t => t.game.trim() === gameName);


    // --- Step 4: Inject placeholder entries for event dates without WL data ---
    const platformForInjection: Platform = selectedPlatform === 'All' ? 'Steam' : selectedPlatform; // Default to Steam if 'All' is selected

    // Encontrar a data mais antiga de um registro real de WL
    const minRealWLDateTimestamp = realWLSales.length > 0 
        ? Math.min(...realWLSales.map(e => startOfDay(e.date!).getTime()))
        : null;

    // Encontrar todas as datas relevantes (WL reais + eventos automáticos + eventos manuais)
    const allDates = new Set<number>();
    realWLSales.forEach(e => e.date && allDates.add(startOfDay(e.date).getTime()));
    eventTracking.forEach(e => {
        if (e.startDate && e.endDate) {
            let currentDate = startOfDay(e.startDate);
            const endDate = startOfDay(e.endDate);
            while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
                allDates.add(currentDate.getTime());
                currentDate = addDays(currentDate, 1);
            }
        }
    });
    manualEventMarkers.forEach(m => allDates.add(startOfDay(m.date).getTime()));


    let sortedDates = Array.from(allDates).sort((a, b) => a - b);
    
    // CRITICAL FIX: Se houver dados reais de WL, comece a linha do tempo apenas a partir da data do primeiro registro real de WL.
    if (minRealWLDateTimestamp !== null) {
        sortedDates = sortedDates.filter(dateTimestamp => dateTimestamp >= minRealWLDateTimestamp);
    }
    
    // Map of real WL entries by date timestamp
    const realWLSalesMap = new Map(realWLSales.map(e => [startOfDay(e.date!).getTime(), e]));

    // Iterate through all relevant dates and create the final list, filling gaps with placeholders
    let lastWLValue = 0; 
    const finalWLSales: WLSalesPlatformEntry[] = [];

    for (const dateTimestamp of sortedDates) {
        const date = new Date(dateTimestamp);
        const existingRealEntry = realWLSalesMap.get(dateTimestamp);

        if (existingRealEntry) {
            // Use real entry and update lastWLValue
            finalWLSales.push(existingRealEntry);
            lastWLValue = existingRealEntry.wishlists;
        } else {
            // Create placeholder entry
            const placeholderEntry: WLSalesPlatformEntry = {
                id: generateLocalUniqueId('wl-placeholder'),
                date: date,
                game: gameName,
                platform: platformForInjection,
                wishlists: lastWLValue, // Use the last known real WL value
                sales: 0, // Sales must be 0 or null for placeholders
                variation: 0,
                saleType: 'Padrão',
                frequency: 'Diário',
                isPlaceholder: true,
            };
            finalWLSales.push(placeholderEntry);
        }
    }

    const wlSales = finalWLSales.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
    // --- End Step 4 ---


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
        game: gameName,
        influencer: influencer,
        totalActions: data.totalActions,
        totalInvestment: data.totalInvestment,
        wishlistsGenerated: data.wishlistsGenerated,
        avgROI: data.wishlistsGenerated > 0 ? data.totalInvestment / data.wishlistsGenerated : '-',
    }));


    // 3. KPI Calculations (based on ALL platforms for the game, except for WL/Sales which respects platform filter)
    const investmentSources = {
        influencers: trackingData.influencerTracking.filter(d => d.game.trim() === gameName).reduce((sum, item) => sum + item.investment, 0),
        events: trackingData.eventTracking.filter(d => d.game.trim() === gameName).reduce((sum, item) => sum + item.cost, 0),
        paidTraffic: trackingData.paidTraffic.filter(d => d.game.trim() === gameName).reduce((sum, item) => sum + item.investedValue, 0),
    };

    const totalInvestment = investmentSources.influencers + investmentSources.events + investmentSources.paidTraffic;

    // Separar Visualizações e Impressões
    const totalInfluencerViews = influencerTracking.reduce((sum, item) => sum + item.views, 0);
    const totalEventViews = eventTracking.reduce((sum, item) => sum + item.views, 0);
    const totalImpressions = paidTraffic.reduce((sum, item) => sum + item.impressions, 0);
    
    // Calculate total WL increase across all time for AVG daily growth calculation
    const totalWLIncrease = realWLSales.length > 0 
        ? realWLSales[realWLSales.length - 1].wishlists - (realWLSales[0].wishlists - realWLSales[0].variation)
        : 0;
    
    // Total Sales and Wishlists (for Game Summary Panel) - based on filtered WL Sales
    const totalSales = realWLSales.reduce((sum, item) => sum + item.sales, 0);
    const totalWishlists = realWLSales.length > 0 ? realWLSales[realWLSales.length - 1].wishlists : 0;

    // Calculate total WL generated from marketing activities
    const totalWLGenerated = influencerTracking.reduce((sum, item) => sum + item.estimatedWL, 0) +
                             eventTracking.reduce((sum, item) => sum + item.wlGenerated, 0) +
                             paidTraffic.reduce((sum, item) => sum + item.estimatedWishlists, 0);

    // --- NEW KPI CALCULATIONS ---
    
    // 4. Calculate WL Growth Metrics based on selectedTimeFrame
    
    let daysToSubtract = 0;
    switch (selectedTimeFrame) {
        case 'weekly': daysToSubtract = 7; break;
        case 'monthly': daysToSubtract = 30; break;
        case 'quarterly': daysToSubtract = 90; break;
        case 'semiannual': daysToSubtract = 180; break;
        case 'annual': daysToSubtract = 365; break;
        case 'total': 
        default: 
            daysToSubtract = 99999; // Effectively total
    }

    const today = startOfDay(new Date());
    const startDateLimit = subDays(today, daysToSubtract);

    // Filter real WL entries within the selected timeframe
    const wlEntriesInTimeFrame = realWLSales.filter(e => 
        e.date && (selectedTimeFrame === 'total' || startOfDay(e.date).getTime() >= startDateLimit.getTime())
    );

    let totalGrowthInPeriod = 0;
    let avgDailyGrowthInPeriod = 0; 

    if (selectedTimeFrame === 'total') {
        totalGrowthInPeriod = totalWLIncrease; 
        const totalDaysTracked = realWLSales.length > 0 ? (realWLSales[realWLSales.length - 1].date!.getTime() - realWLSales[0].date!.getTime()) / (1000 * 60 * 60 * 24) + 1 : 0;
        avgDailyGrowthInPeriod = totalDaysTracked > 0 ? totalWLIncrease / totalDaysTracked : 0;
    } else {
        // Calculate growth within the window: sum of variations
        const firstEntryInPeriod = wlEntriesInTimeFrame[0];
        const lastEntryInPeriod = wlEntriesInTimeFrame[wlEntriesInTimeFrame.length - 1];
        
        if (firstEntryInPeriod && lastEntryInPeriod) {
            // Find the WL value immediately preceding the start of the period
            const indexBeforeStart = realWLSales.findIndex(e => e.id === firstEntryInPeriod.id) - 1;
            const wlBeforePeriod = indexBeforeStart >= 0 ? realWLSales[indexBeforeStart].wishlists : 0;
            
            totalGrowthInPeriod = lastEntryInPeriod.wishlists - wlBeforePeriod;

            // Calculate average daily growth in this specific period
            const daysInPeriod = (lastEntryInPeriod.date!.getTime() - firstEntryInPeriod.date!.getTime()) / (1000 * 60 * 60 * 24) + 1;
            avgDailyGrowthInPeriod = daysInPeriod > 0 ? totalGrowthInPeriod / daysInPeriod : 0;

        } else {
            totalGrowthInPeriod = 0;
            avgDailyGrowthInPeriod = 0;
        }
    }
    
    // 5. Calculate Conversion Rates
    
    // C. WL-to-Sales Conversion Rate (Post-Launch)
    const wlToSalesSummary = trackingData.resultSummary.find(r => r.game.trim() === gameName && r['Conversão vendas/wl']);
    const wlToSalesConversionRate = Number(wlToSalesSummary?.['Conversão vendas/wl']) || 0;

    // D. Visitor-to-Wishlist Conversion Rate (V2W) - Use manual traffic data if available
    let totalVisits = 0;
    let totalWishlistsInTrafficPeriod = 0;
    let visitorToWlConversionRate = 0;

    // Find the latest traffic entry for the current game/platform (defaulting to Steam if 'All' selected)
    const relevantPlatform = selectedPlatform === 'All' ? 'Steam' : selectedPlatform;
    const latestTrafficEntry = trackingData.trafficTracking
        .filter(t => t.game.trim() === gameName && t.platform === relevantPlatform)
        .sort((a, b) => (b.endDate?.getTime() || 0) - (a.endDate?.getTime() || 0))[0];

    if (latestTrafficEntry && latestTrafficEntry.startDate && latestTrafficEntry.endDate) {
        totalVisits = latestTrafficEntry.visits;
        
        // Calculate WL increase during the traffic period
        const trafficStart = startOfDay(latestTrafficEntry.startDate).getTime();
        const trafficEnd = startOfDay(latestTrafficEntry.endDate).getTime();

        const wlEntriesInTrafficPeriod = realWLSales.filter(e => 
            e.date && startOfDay(e.date).getTime() >= trafficStart && startOfDay(e.date).getTime() <= trafficEnd
        );

        if (wlEntriesInTrafficPeriod.length > 1) {
            const initialWL = wlEntriesInTrafficPeriod[0].wishlists - wlEntriesInTrafficPeriod[0].variation; // WL before the period started
            const finalWL = wlEntriesInTrafficPeriod[wlEntriesInTrafficPeriod.length - 1].wishlists;
            totalWishlistsInTrafficPeriod = finalWL - initialWL;
        } else if (wlEntriesInTrafficPeriod.length === 1) {
             // If only one entry, use its variation
             totalWishlistsInTrafficPeriod = wlEntriesInTrafficPeriod[0].variation;
        }
        
        if (totalVisits > 0) {
            visitorToWlConversionRate = totalWishlistsInTrafficPeriod / totalVisits;
        }
    } else {
        // Fallback to static data if no manual traffic entry exists
        const rawTrafficData = rawData['Trafego pago'] as any[];
        const gameConversionEntry = rawTrafficData.find(item => item.Game_1?.trim() === gameName);
        visitorToWlConversionRate = Number(gameConversionEntry?.['Conversão Steam']) || 0;
    }
    
    // Final KPI object structure:
    const kpis = {
        gameId,
        totalInvestment,
        totalInfluencerViews,
        totalEventViews,
        totalImpressions,
        totalWLGenerated,
        totalSales,
        totalWishlists,
        investmentSources,
        launchDate,
        suggestedPrice, // Pass suggested price
        capsuleImageUrl, // NEW: Pass capsule image URL
        avgDailyGrowth: avgDailyGrowthInPeriod, // Use the period-specific average
        totalGrowth: totalGrowthInPeriod, 
        visitorToWlConversionRate,
        wlToSalesConversionRate,
    };
    
    return {
      resultSummary: trackingData.resultSummary.filter(d => d.game.trim() === gameName),
      wlSales,
      influencerSummary, 
      influencerTracking,
      eventTracking, 
      paidTraffic,
      demoTracking: trackingData.demoTracking.filter(d => d.game.trim() === gameName),
      trafficTracking, 
      wlDetails: trackingData.wlDetails.find(d => d.game.trim() === gameName),
      manualEventMarkers, 
      kpis,
    };
  }, [selectedGameName, selectedPlatform, trackingData, recalculateWLSales, selectedGame, selectedTimeFrame]);

  // Determine if a manual marker already exists for the selected date
  const existingMarkerForClickedEntry = useMemo(() => {
    if (!clickedWLSalesEntry || !clickedWLSalesEntry.date) return undefined;
    const dateTimestamp = startOfDay(clickedWLSalesEntry.date).getTime();
    return filteredData?.manualEventMarkers.find(m => startOfDay(m.date).getTime() === dateTimestamp);
  }, [clickedWLSalesEntry, filteredData]);
  
  // Componente de Configuração de Cores
  const ColorConfigForm = () => (
    <div className="space-y-4 p-4">
        <h3 className="text-lg font-semibold">Configuração de Cores do Gráfico WL/Vendas</h3>
        
        {Object.keys(defaultChartColors).map(key => {
            const labelMap: Record<keyof WLSalesChartColors, string> = {
                daily: 'WL Diária (Círculo)',
                weekly: 'WL Semanal (Triângulo)',
                monthly: 'WL Mensal (Quadrado)',
                event: 'WL em Evento (Destaque)',
                sales: 'Vendas (Linha)',
            };
            const colorKey = key as keyof WLSalesChartColors;

            return (
                <div key={key} className="flex items-center justify-between space-x-4">
                    <Label htmlFor={`color-${key}`}>{labelMap[colorKey]}</Label>
                    <Input
                        id={`color-${key}`}
                        type="color"
                        value={chartColors[colorKey]}
                        onChange={(e) => setChartColors(prev => ({ ...prev, [colorKey]: e.target.value }))}
                        className="w-16 h-8 p-0 border-none cursor-pointer"
                    />
                </div>
            );
        })}

        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setChartColors(defaultChartColors)}>
                Resetar Padrão
            </Button>
            <Button type="button" onClick={() => setIsColorConfigOpen(false)} className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                Fechar
            </Button>
        </div>
    </div>
  );


  // Renderização condicional para quando não há jogos
  if (allAvailableGames.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background text-foreground gaming-background">
            <Card className="p-6 shadow-xl border border-border">
                <h1 className="text-2xl font-bold mb-4 text-gogo-cyan">Dashboard de Rastreamento</h1>
                <p className="text-muted-foreground">Nenhum dado de rastreamento encontrado.</p>
                <Button onClick={() => setIsAddGameFormOpen(true)} className="mt-4 bg-gogo-cyan hover:bg-gogo-cyan/90">
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Primeiro Jogo
                </Button>
                <AddGameModal 
                    isOpen={isAddGameFormOpen} 
                    onClose={() => setIsAddGameFormOpen(false)} 
                    onSave={handleAddGame} 
                />
            </Card>
        </div>
    );
  }

  // Renderização principal
  return (
    <div className="min-h-screen p-4 md:p-8 font-sans gaming-background">
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[calc(100vh-64px)] w-full rounded-lg border border-border bg-card text-card-foreground shadow-gogo-cyan-glow transition-shadow duration-300"
      >
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="p-4 bg-muted/20 border-r border-border shadow-inner">
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-6 text-gogo-cyan">Selecione um Jogo</h2>
            <div className="flex-grow space-y-4">
              <div className="space-y-2">
                <Label htmlFor="game-select" className="font-semibold text-foreground">Jogo:</Label>
                <Select onValueChange={setSelectedGameName} defaultValue={selectedGameName}>
                  <SelectTrigger id="game-select" className="w-full bg-background">
                    <SelectValue placeholder="Selecione um jogo" />
                  </SelectTrigger>
                  <SelectContent>
                    {allAvailableGames.map(game => (
                      <SelectItem key={game.id} value={game.name}>{game.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={() => setIsAddGameFormOpen(true)} className="w-full bg-gogo-orange hover:bg-gogo-orange/90 text-white">
                <Plus className="h-4 w-4 mr-2" /> Adicionar Novo Jogo
              </Button>
            </div>
            
            {/* AI Data Processor Button added here */}
            <Dialog open={isAIDataProcessorOpen} onOpenChange={setIsAIDataProcessorOpen}>
                <DialogTrigger asChild>
                    <Button 
                        onClick={() => setIsAIDataProcessorOpen(true)} 
                        variant="default" 
                        className="w-full text-sm mt-4 bg-gogo-cyan hover:bg-gogo-cyan/90 text-white"
                    >
                        <Bot className="h-4 w-4 mr-2" /> Processar Dados com IA
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                    <AIDataProcessor 
                        gameName={selectedGameName}
                        onDataProcessed={handleAIDataProcessed}
                        onClose={() => setIsAIDataProcessorOpen(false)}
                    />
                </DialogContent>
            </Dialog>
            
            {/* Delete Game Button */}
            {selectedGame && (
                <DeleteGameButton 
                    gameId={selectedGame.id}
                    gameName={selectedGame.name}
                    onDelete={handleDeleteGame}
                />
            )}

            {/* Backup/Restore and AI Help Buttons */}
            <div className="mt-auto pt-4 border-t border-border space-y-2">
                <Button 
                    onClick={handleCreateBackup} 
                    variant="outline" 
                    className="w-full text-sm text-gogo-orange border-gogo-orange hover:bg-gogo-orange/10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    Salvar Snapshot (Undo)
                </Button>
                <Label htmlFor="restore-input" className="w-full">
                    <Button 
                        asChild
                        variant="outline" 
                        className="w-full text-sm text-muted-foreground border-border hover:bg-muted/50"
                    >
                        <div className="flex items-center cursor-pointer">
                            <History className="h-4 w-4 mr-2" /> Restaurar Snapshot
                            <input 
                                id="restore-input"
                                type="file" 
                                accept=".json" 
                                onChange={handleRestoreBackup} 
                                className="hidden"
                            />
                        </div>
                    </Button>
                </Label>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-border w-2 hover:bg-gogo-cyan transition-colors" />
        <ResizablePanel defaultSize={80} className="p-6 bg-background">
          <div className="space-y-8">
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-extrabold text-gogo-cyan drop-shadow-md font-gamer">
                        Gogo Games Dashboard
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">Análise de Performance de Jogos</p>
                </div>
                <ThemeToggle />
            </header>

            {filteredData && (
                <>
                    <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap border-b border-border bg-card text-muted-foreground rounded-t-lg p-0 h-auto shadow-md">
                            <TabsTrigger value="overview" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-gogo-orange transition-all duration-200 hover:bg-gogo-cyan/10">Visão Geral</TabsTrigger>
                            <TabsTrigger value="wl-sales" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-gogo-orange transition-all duration-200 hover:bg-gogo-cyan/10">Evolução WL/Vendas</TabsTrigger>
                            <TabsTrigger value="steam-page" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-gogo-orange transition-all duration-200 hover:bg-gogo-cyan/10">Página Steam</TabsTrigger> 
                            <TabsTrigger value="comparisons" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-gogo-orange transition-all duration-200 hover:bg-gogo-cyan/10">Comparações</TabsTrigger>
                            <TabsTrigger value="influencers" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-gogo-orange transition-all duration-200 hover:bg-gogo-cyan/10">Influencers</TabsTrigger>
                            <TabsTrigger value="events" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-gogo-orange transition-all duration-200 hover:bg-gogo-cyan/10">Eventos</TabsTrigger>
                            <TabsTrigger value="paid-traffic" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-gogo-orange transition-all duration-200 hover:bg-gogo-cyan/10">Tráfego Pago</TabsTrigger>
                            <TabsTrigger value="demo" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-gogo-orange transition-all duration-200 hover:bg-gogo-cyan/10">Demo</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6 mt-4 p-6 bg-card rounded-b-lg shadow-xl border border-border">
                            <GameSummaryPanel 
                                gameId={filteredData.kpis.gameId}
                                gameName={selectedGameName}
                                totalSales={filteredData.kpis.totalSales}
                                totalWishlists={filteredData.kpis.totalWishlists}
                                totalInvestment={filteredData.kpis.totalInvestment}
                                totalInfluencerViews={filteredData.kpis.totalInfluencerViews}
                                totalEventViews={filteredData.kpis.totalEventViews}
                                totalImpressions={filteredData.kpis.totalImpressions}
                                launchDate={filteredData.kpis.launchDate}
                                investmentSources={filteredData.kpis.investmentSources}
                                onUpdateLaunchDate={handleUpdateLaunchDate}
                                // Pass suggested price and image URL
                                suggestedPrice={filteredData.kpis.suggestedPrice} 
                                capsuleImageUrl={filteredData.kpis.capsuleImageUrl}
                            />
                            
                            <WlConversionKpisPanel 
                                avgDailyGrowth={filteredData.kpis.avgDailyGrowth}
                                totalGrowth={filteredData.kpis.totalGrowth}
                                timeFrame={selectedTimeFrame}
                                onTimeFrameChange={setSelectedTimeFrame}
                                visitorToWlConversionRate={filteredData.kpis.visitorToWlConversionRate}
                                wlToSalesConversionRate={filteredData.kpis.wlToSalesConversionRate}
                                onCardClick={(tab: 'wl-sales' | 'traffic') => setSelectedTab(tab)} 
                            />
                            
                            <ResultSummaryPanel data={filteredData.resultSummary} />
                        </TabsContent>

                        <TabsContent value="wl-sales" className="space-y-6 mt-4 p-6 bg-card rounded-b-lg shadow-xl border border-border">
                            <Card className="bg-muted/50 border-none shadow-none">
                                <CardContent className="flex flex-col md:flex-row items-center gap-4 p-4">
                                    <Label htmlFor="platform-select" className="font-semibold text-foreground min-w-[150px]">Filtrar por Plataforma:</Label>
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

                            <div className="flex flex-wrap justify-end gap-2 mb-4">
                                <Dialog open={isColorConfigOpen} onOpenChange={setIsColorConfigOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-gogo-cyan border-gogo-cyan hover:bg-gogo-cyan/10">
                                            <Palette className="h-4 w-4 mr-2" /> Cores do Gráfico
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[450px]">
                                        <DialogHeader>
                                            <DialogTitle>Configurar Cores</DialogTitle>
                                        </DialogHeader>
                                        <ColorConfigForm />
                                    </DialogContent>
                                </Dialog>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                        // Create a temporary placeholder entry for today to open the action menu
                                        const todayEntry: WLSalesPlatformEntry = {
                                            id: generateLocalUniqueId('temp-today'),
                                            date: startOfDay(new Date()),
                                            game: selectedGameName,
                                            platform: selectedPlatform === 'All' ? 'Steam' : selectedPlatform,
                                            wishlists: filteredData.wlSales.length > 0 ? filteredData.wlSales[filteredData.wlSales.length - 1].wishlists : 0,
                                            sales: 0,
                                            variation: 0,
                                            saleType: 'Padrão',
                                            frequency: 'Diário',
                                            isPlaceholder: true,
                                        };
                                        setClickedWLSalesEntry(todayEntry);
                                    }} 
                                    className="text-gogo-orange border-gogo-orange hover:bg-gogo-orange/10"
                                >
                                    <CalendarPlus className="h-4 w-4 mr-2" /> Marcar Evento Manual
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsHistoryVisible(!isHistoryVisible)} className="text-gogo-cyan border-gogo-cyan hover:bg-gogo-cyan/10">
                                    {isHistoryVisible ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                    {isHistoryVisible ? 'Ocultar Histórico' : 'Mostrar Histórico'}
                                </Button>
                                <ExportDataButton 
                                    data={filteredData.wlSales.filter(e => !e.isPlaceholder)} // Do not export placeholders
                                    filename={`${selectedGameName}_${selectedPlatform}_WL_Vendas.csv`} 
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
                            <WLSalesChartPanel 
                                data={filteredData.wlSales} 
                                onPointClick={handleChartPointClick} 
                                eventTracking={filteredData.eventTracking}
                                manualEventMarkers={filteredData.manualEventMarkers}
                                chartColors={chartColors} // Passando as cores
                            />
                            {isHistoryVisible && (
                                <WLSalesTablePanel 
                                    data={filteredData.wlSales.filter(e => !e.isPlaceholder)} // Do not show placeholders in table
                                    onDelete={handleDeleteWLSalesEntry} 
                                    onEdit={handleEditWLSalesEntry}
                                    games={trackingData.games}
                                />
                            )}
                        </TabsContent>
                        
                        {/* STEAM PAGE TAB */}
                        <TabsContent value="steam-page" className="space-y-6 mt-4 p-6 bg-card rounded-b-lg shadow-xl border border-border">
                            <h2 className="text-2xl font-bold text-gogo-orange mb-4">Detalhes da Página Steam</h2>
                            
                            <SalesByTypeChart data={filteredData.wlSales.filter(e => e.platform === 'Steam' || selectedPlatform === 'Steam')} />
                            
                            {filteredData.wlDetails && (
                                <WlDetailsManager 
                                    details={filteredData.wlDetails} 
                                    gameName={selectedGameName}
                                    allGames={trackingData.games} 
                                    onUpdateDetails={handleUpdateWlDetails}
                                    onAddTraffic={handleAddTrafficEntry} 
                                />
                            )}

                            <DemoTrackingPanel 
                                data={filteredData.demoTracking} 
                                onDeleteTracking={handleDeleteDemoEntry} 
                                onEditTracking={(entry) => setEditingDemoEntry(entry)}
                            />
                            <div className="flex justify-end mb-4 space-x-2">
                                <Dialog open={isAddDemoFormOpen} onOpenChange={setIsAddDemoFormOpen}>
                                    <DialogTrigger asChild>
                                        <Button onClick={() => setIsAddDemoFormOpen(true)} className="bg-gogo-cyan hover:bg-gogo-cyan/90 text-white">
                                            <Plus className="h-4 w-4 mr-2" /> Adicionar Demo
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[600px]">
                                        <DialogHeader>
                                            <DialogTitle>Adicionar Nova Entrada de Demo Tracking</DialogTitle>
                                        </DialogHeader>
                                        <AddDemoForm 
                                            gameName={selectedGameName} 
                                            onSave={handleAddDemoEntry} 
                                            onClose={() => setIsAddDemoFormOpen(false)} 
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </TabsContent>

                        <TabsContent value="comparisons" className="space-y-6 mt-4 p-6 bg-card rounded-b-lg shadow-xl border border-border">
                            <WlComparisonsPanel data={filteredData.wlSales} allPlatforms={ALL_PLATFORMS} />
                        </TabsContent>

                        <TabsContent value="influencers" className="space-y-6 mt-4 p-6 bg-card rounded-b-lg shadow-xl border border-border">
                            <div className="flex justify-end mb-4 space-x-2">
                                <ExportDataButton 
                                    data={filteredData.influencerTracking} 
                                    filename={`${selectedGameName}_Influencers_Tracking.csv`} 
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

                        <TabsContent value="events" className="space-y-6 mt-4 p-6 bg-card rounded-b-lg shadow-xl border border-border">
                            <div className="flex justify-end mb-4 space-x-2">
                                <ExportDataButton 
                                    data={filteredData.eventTracking} 
                                    filename={`${selectedGameName}_Eventos_Tracking.csv`} 
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

                        <TabsContent value="paid-traffic" className="space-y-6 mt-4 p-6 bg-card rounded-b-lg shadow-xl border border-border">
                            <div className="flex justify-end mb-4 space-x-2">
                                <ExportDataButton 
                                    data={filteredData.paidTraffic} 
                                    filename={`${selectedGameName}_Trafego_Pago.csv`} 
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
                        
                        <TabsContent value="demo" className="space-y-6 mt-4 p-6 bg-card rounded-b-lg shadow-xl border border-border">
                            {/* Conteúdo da aba Demo movido para steam-page, mas mantendo o formulário de edição aqui para consistência se necessário */}
                            <p className="text-muted-foreground">O tracking de Demo foi movido para a aba "Página Steam" para consolidar dados específicos da Steam.</p>
                        </TabsContent>
                    </Tabs>

                    {/* Dialog for editing Demo Tracking entry */}
                    <Dialog open={!!editingDemoEntry} onOpenChange={(open) => !open && setEditingDemoEntry(null)}>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Editar Entrada de Demo Tracking</DialogTitle>
                            </DialogHeader>
                            {editingDemoEntry && (
                                <EditDemoForm 
                                    entry={editingDemoEntry}
                                    onSave={handleEditDemoEntry}
                                    onClose={() => setEditingDemoEntry(null)}
                                />
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* NEW: Dialog for WL Sales Action Menu (triggered by chart click or manual button) */}
                    <Dialog open={!!clickedWLSalesEntry} onOpenChange={(open) => !open && setClickedWLSalesEntry(null)}>
                        <DialogContent className={clickedWLSalesEntry?.isPlaceholder ? "sm:max-w-[450px]" : "sm:max-w-[600px]"}>
                            {clickedWLSalesEntry && (
                                <WLSalesActionMenu
                                    entry={clickedWLSalesEntry}
                                    existingMarker={existingMarkerForClickedEntry}
                                    gameName={selectedGameName}
                                    onEditWLSales={handleEditWLSalesEntry}
                                    onSaveManualMarker={handleSaveManualMarker}
                                    onDeleteManualMarker={handleDeleteManualMarker}
                                    onClose={() => setClickedWLSalesEntry(null)}
                                    // Pass ALL tracking data for the Daily Summary Panel
                                    allWLSales={trackingData.wlSales.filter(e => e.game.trim() === selectedGameName)}
                                    allInfluencerTracking={trackingData.influencerTracking.filter(e => e.game.trim() === selectedGameName)}
                                    allEventTracking={trackingData.eventTracking.filter(e => e.game.trim() === selectedGameName)}
                                    allPaidTraffic={trackingData.paidTraffic.filter(e => e.game.trim() === selectedGameName)}
                                    allDemoTracking={trackingData.demoTracking.filter(e => e.game.trim() === selectedGameName)}
                                    allManualEventMarkers={trackingData.manualEventMarkers.filter(e => e.game.trim() === selectedGameName)}
                                />
                            )}
                        </DialogContent>
                    </Dialog>
                </>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <MadeWithDyad />
      
      {/* RENDERIZANDO O MODAL DE ADICIONAR JOGO AQUI */}
      <AddGameModal 
          isOpen={isAddGameFormOpen} 
          onClose={() => setIsAddGameFormOpen(false)} 
          onSave={handleAddGame} 
      />
    </div>
  );
};

export default Dashboard;