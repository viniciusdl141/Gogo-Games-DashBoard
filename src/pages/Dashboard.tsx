"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSession } from '@/components/SessionContextProvider';
import { getTrackingData, TrackingData, WLSalesPlatformEntry, InfluencerTrackingEntry, EventTrackingEntry, PaidTrafficEntry, DemoTrackingEntry, ResultSummaryEntry, WlDetails, ManualEventMarker, TrafficEntry, Platform, EntryFrequency, SaleType } from '@/data/trackingData';
import { getGames, addGame, updateGame, deleteGame, Game as SupabaseGame } from '@/integrations/supabase/games';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, LogOut, Bot, List, CalendarDays, DollarSign, Edit, Trash2, Settings, Clock, Eye, Megaphone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ThemeToggle';
import { isBefore, isEqual, subDays, startOfDay } from 'date-fns';

// Dashboard Components
import GameSummaryPanel from '@/components/dashboard/GameSummaryPanel';
import WlConversionKpisPanel, { TimeFrame } from '@/components/dashboard/WlConversionKpisPanel';
import WLSalesChartPanel from '@/components/dashboard/WLSalesChartPanel';
import WLSalesTablePanel from '@/components/dashboard/WLSalesTablePanel';
import InfluencerPanel from '@/components/dashboard/InfluencerPanel';
import EventPanel from '@/components/dashboard/EventPanel';
import PaidTrafficPanel from '@/components/dashboard/PaidTrafficPanel';
import DemoTrackingPanel from '@/components/dashboard/DemoTrackingPanel';
import ResultSummaryPanel from '@/components/dashboard/ResultSummaryPanel';
import WlDetailsManager from '@/components/dashboard/WlDetailsManager';
import AddGameModal from '@/components/dashboard/AddGameModal';
import AIDataProcessor from '@/components/dashboard/AIDataProcessor';
import WLSalesActionMenu from '@/components/dashboard/WLSalesActionMenu';
import AddWLSalesForm from '@/components/dashboard/AddWLSalesForm';
import AddInfluencerForm from '@/components/dashboard/AddInfluencerForm';
import AddEventForm from '@/components/dashboard/AddEventForm';
import AddPaidTrafficForm from '@/components/dashboard/AddPaidTrafficForm';
import AddDemoForm from '@/components/dashboard/AddDemoForm';
import DeleteGameButton from '@/components/dashboard/DeleteGameButton';
import WlComparisonsPanel from '@/components/dashboard/WlComparisonsPanel';
import AddTrafficForm from '@/components/dashboard/AddTrafficForm';

// --- Data Fetching and State Management ---

// 1. Fetch Supabase Games
const useSupabaseGames = () => {
    return useQuery<SupabaseGame[], Error>({
        queryKey: ['supabaseGames'],
        queryFn: getGames,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

// 2. Fetch Static Tracking Data (Simulated local data store)
const useStaticTrackingData = () => {
    return useQuery<TrackingData, Error>({
        queryKey: ['staticTrackingData'],
        queryFn: getTrackingData,
        staleTime: Infinity, // Static data doesn't change
    });
};

// --- KPI Calculation Logic ---

const calculateKpis = (wlSales: WLSalesPlatformEntry[], trafficTracking: TrafficEntry[], timeFrame: TimeFrame, supabaseGames: SupabaseGame[] | undefined, selectedGame: string) => {
    if (wlSales.length === 0) {
        return {
            avgDailyGrowth: 0,
            totalGrowth: 0,
            visitorToWlConversionRate: 0,
            wlToSalesConversionRate: 0,
        };
    }

    const today = startOfDay(new Date());
    let startDate: Date | null = null;

    switch (timeFrame) {
        case 'weekly': startDate = subDays(today, 7); break;
        case 'monthly': startDate = subDays(today, 30); break;
        case 'quarterly': startDate = subDays(today, 90); break;
        case 'semiannual': startDate = subDays(today, 180); break;
        case 'annual': startDate = subDays(today, 365); break;
        case 'total': startDate = null; break;
    }

    const filteredWLSales = wlSales.filter(e => {
        if (!e.date) return false;
        const entryDate = startOfDay(e.date);
        if (startDate && isBefore(entryDate, startDate)) return false;
        return true;
    }).sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

    // 1. Total Growth & Avg Daily Growth
    let totalGrowth = 0;
    let daysInPeriod = 0;
    
    if (filteredWLSales.length > 0) {
        const firstWL = filteredWLSales[0].wishlists - filteredWLSales[0].variation; // Estimate WL before the first entry's change
        const lastWL = filteredWLSales[filteredWLSales.length - 1].wishlists;
        
        totalGrowth = lastWL - firstWL;
        
        const firstDate = filteredWLSales[0].date;
        if (startDate && firstDate && isAfter(firstDate, startDate)) {
            // If the first entry is later than the start date, use the first entry date
            daysInPeriod = Math.max(1, Math.ceil((today.getTime() - startOfDay(firstDate).getTime()) / (1000 * 60 * 60 * 24)));
        } else if (startDate) {
            daysInPeriod = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        } else if (firstDate) {
            // If 'total', calculate days from the first entry
            daysInPeriod = Math.max(1, Math.ceil((today.getTime() - startOfDay(firstDate).getTime()) / (1000 * 60 * 60 * 24)));
        }
    }
    
    const avgDailyGrowth = daysInPeriod > 0 ? totalGrowth / daysInPeriod : 0;

    // 2. Visitor -> WL Conversion Rate
    const totalVisits = trafficTracking.reduce((sum, t) => sum + t.visits, 0);
    const totalWLInPeriod = filteredWLSales.reduce((sum, e) => sum + e.variation, 0); // Sum of daily variations

    const visitorToWlConversionRate = totalVisits > 0 ? totalWLInPeriod / totalVisits : 0;

    // 3. WL -> Sales Conversion Rate (Requires launch date)
    const gameData = supabaseGames?.find(g => g.name === selectedGame);
    let wlToSalesConversionRate = 0;

    if (gameData?.launch_date) {
        const launchDate = startOfDay(new Date(gameData.launch_date));
        
        // Only calculate conversion if the game has launched
        if (isBefore(launchDate, today) || isEqual(launchDate, today)) {
            const totalSales = filteredWLSales.reduce((sum, e) => sum + e.sales, 0);
            
            // Find the total WL count just before launch
            const preLaunchWL = wlSales
                .filter(e => e.date && isBefore(startOfDay(e.date), launchDate))
                .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
                .pop()?.wishlists || 0;

            // Use the total WL recorded before launch as the base for conversion
            if (preLaunchWL > 0) {
                wlToSalesConversionRate = totalSales / preLaunchWL;
            }
        }
    }

    return {
        avgDailyGrowth,
        totalGrowth,
        visitorToWlConversionRate,
        wlToSalesConversionRate,
    };
};


// --- Dashboard Component Start ---

const Dashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const { session, profile, isLoading: isSessionLoading, user } = useSession();
    const isMobile = useIsMobile();

    // --- State ---
    const [selectedGame, setSelectedGame] = useState<string>('');
    const [activeTab, setActiveTab] = useState('summary'); // For mobile view
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('monthly');
    
    // Modal States
    const [isAddGameModalOpen, setIsAddGameModalOpen] = useState(false);
    const [isAIDataProcessorOpen, setIsAIDataProcessorOpen] = useState(false);
    const [isWlDetailsManagerOpen, setIsWlDetailsManagerOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [selectedWLSalesEntry, setSelectedWLSalesEntry] = useState<WLSalesPlatformEntry | null>(null);

    // Form Modals
    const [isAddWLSalesFormOpen, setIsAddWLSalesFormOpen] = useState(false);
    const [isAddInfluencerFormOpen, setIsAddInfluencerFormOpen] = useState(false);
    const [isAddEventFormOpen, setIsAddEventFormOpen] = useState(false);
    const [isAddPaidTrafficFormOpen, setIsAddPaidTrafficFormOpen] = useState(false);
    const [isAddDemoFormOpen, setIsAddDemoFormOpen] = useState(false);
    const [isAddTrafficFormOpen, setIsAddTrafficFormOpen] = useState(false);

    // --- Data Queries ---
    const { data: staticData, isLoading: isLoadingStatic } = useStaticTrackingData();
    const supabaseGamesQuery = useSupabaseGames();
    const { data: supabaseGames, isLoading: isLoadingSupabaseGames } = supabaseGamesQuery;
    
    const isLoading = isSessionLoading || isLoadingStatic || isLoadingSupabaseGames;

    // 3. Combine and Filter Data Hook
    const filteredData = useMemo(() => {
        if (!staticData || !supabaseGames || !selectedGame) {
            return {
                games: [],
                wlSales: [],
                influencerTracking: [],
                influencerSummary: [],
                eventTracking: [],
                paidTraffic: [],
                demoTracking: [],
                trafficTracking: [],
                resultSummary: [],
                wlDetails: [],
                manualEventMarkers: [],
                selectedGameData: null,
                allPlatforms: [],
            };
        }

        const normalizeGameName = (name: string) => name.trim().toLowerCase();
        const normalizedSelectedGame = normalizeGameName(selectedGame);

        // Combine static and dynamic game lists
        const allGames = supabaseGames.map(g => g.name).sort();
        
        const selectedGameData = supabaseGames.find(g => normalizeGameName(g.name) === normalizedSelectedGame) || null;

        // Filter static data by selected game
        const filterByGame = (arr: any[]) => arr.filter(item => normalizeGameName(item.game) === normalizedSelectedGame);

        const wlSales = filterByGame(staticData.wlSales) as WLSalesPlatformEntry[];
        const influencerTracking = filterByGame(staticData.influencerTracking) as InfluencerTrackingEntry[];
        const eventTracking = filterByGame(staticData.eventTracking) as EventTrackingEntry[];
        const paidTraffic = filterByGame(staticData.paidTraffic) as PaidTrafficEntry[];
        const demoTracking = filterByGame(staticData.demoTracking) as DemoTrackingEntry[];
        const trafficTracking = filterByGame(staticData.trafficTracking) as TrafficEntry[];
        const manualEventMarkers = filterByGame(staticData.manualEventMarkers) as ManualEventMarker[];
        const resultSummary = filterByGame(staticData.resultSummary) as ResultSummaryEntry[];
        const wlDetails = filterByGame(staticData.wlDetails) as WlDetails[];
        
        // Calculate unique platforms for the selected game
        const allPlatforms = Array.from(new Set(wlSales.map(e => e.platform))).sort() as Platform[];

        return {
            games: allGames,
            wlSales,
            influencerTracking,
            influencerSummary: filterByGame(staticData.influencerSummary),
            eventTracking,
            paidTraffic,
            demoTracking,
            trafficTracking,
            resultSummary,
            wlDetails,
            manualEventMarkers,
            selectedGameData,
            allPlatforms,
        };
    }, [selectedGame, staticData, supabaseGames]);

    const { 
        games, 
        wlSales, 
        influencerTracking, 
        influencerSummary, 
        eventTracking, 
        paidTraffic, 
        demoTracking, 
        trafficTracking, 
        resultSummary, 
        wlDetails, 
        manualEventMarkers,
        selectedGameData,
        allPlatforms,
    } = filteredData;

    // Set initial selected game
    useEffect(() => {
        if (!selectedGame && games.length > 0) {
            setSelectedGame(games[0]);
        }
    }, [games, selectedGame]);

    // --- KPI Calculations ---
    const kpis = useMemo(() => calculateKpis(wlSales, trafficTracking, timeFrame, supabaseGames, selectedGame), [wlSales, trafficTracking, timeFrame, supabaseGames, selectedGame]);

    // --- Total Calculations for Summary Panel ---
    const totalCalculations = useMemo(() => {
        const totalSales = wlSales.reduce((sum, e) => sum + e.sales, 0);
        const totalInfluencerInvestment = influencerTracking.reduce((sum, e) => sum + e.investment, 0);
        const totalEventInvestment = eventTracking.reduce((sum, e) => sum + e.cost, 0);
        const totalPaidTrafficInvestment = paidTraffic.reduce((sum, e) => sum + e.investedValue, 0);
        const totalInvestment = totalInfluencerInvestment + totalEventInvestment + totalPaidTrafficInvestment;
        
        const totalInfluencerViews = influencerTracking.reduce((sum, e) => sum + e.views, 0);
        const totalEventViews = eventTracking.reduce((sum, e) => sum + e.views, 0);
        const totalImpressions = paidTraffic.reduce((sum, e) => sum + e.impressions, 0);

        // Get latest WL count
        const totalWishlists = wlSales.length > 0 ? wlSales[wlSales.length - 1].wishlists : 0;

        return {
            totalSales,
            totalWishlists,
            totalInvestment,
            totalInfluencerViews,
            totalEventViews,
            totalImpressions,
            investmentSources: {
                influencers: totalInfluencerInvestment,
                events: totalEventInvestment,
                paidTraffic: totalPaidTrafficInvestment,
            }
        };
    }, [wlSales, influencerTracking, eventTracking, paidTraffic]);

    // --- CRUD Handlers (Optimistic Updates) ---

    const invalidateAll = () => queryClient.invalidateQueries({ queryKey: ['staticTrackingData'] });
    const invalidateGames = () => queryClient.invalidateQueries({ queryKey: ['supabaseGames'] });

    // Generic mutation handler for new entries (using local state for now, simulating Supabase sync later)
    const handleAddTracking = useCallback((data: any, type: keyof TrackingData, dbTable: string) => {
        const newEntry = {
            ...data,
            id: `local-${Date.now()}-${Math.random()}`,
            game: selectedGame,
            date: data.date ? new Date(data.date) : new Date(),
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
        };

        // Optimistic Update (Local State)
        queryClient.setQueryData(['staticTrackingData'], (oldData: TrackingData | undefined) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                [type]: [...(oldData[type] as any[]), newEntry],
            };
        });

        // Simulate Supabase insertion
        console.log(`Simulating ADD to ${dbTable}:`, newEntry);
        toast.success(`Nova entrada de ${dbTable.replace('_', ' ')} adicionada.`);
        invalidateAll(); // Re-fetch/re-process data
    }, [queryClient, selectedGame]);

    // Generic mutation handler for updates
    const handleEditTracking = useCallback((updatedEntry: any, type: keyof TrackingData, dbTable: string) => {
        // Optimistic Update (Local State)
        queryClient.setQueryData(['staticTrackingData'], (oldData: TrackingData | undefined) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                [type]: (oldData[type] as any[]).map(item => 
                    item.id === updatedEntry.id ? updatedEntry : item
                ),
            };
        });

        // Simulate Supabase update
        console.log(`Simulating UPDATE to ${dbTable}:`, updatedEntry);
        toast.success(`Entrada de ${dbTable.replace('_', ' ')} atualizada.`);
        invalidateAll();
    }, [queryClient]);

    // Generic mutation handler for deletion
    const handleDeleteTracking = useCallback((id: string, type: keyof TrackingData, dbTable: string) => {
        // Optimistic Update (Local State)
        queryClient.setQueryData(['staticTrackingData'], (oldData: TrackingData | undefined) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                [type]: (oldData[type] as any[]).filter(item => item.id !== id),
            };
        });

        // Simulate Supabase deletion
        console.log(`Simulating DELETE from ${dbTable}: ID ${id}`);
        toast.success(`Entrada de ${dbTable.replace('_', ' ')} removida.`);
        invalidateAll();
    }, [queryClient]);

    // Specific Handlers using the generic ones
    const handleAddWLSales = (data: any) => handleAddTracking(data, 'wlSales', 'wl_sales_tracking');
    const handleEditWLSales = (entry: WLSalesPlatformEntry) => handleEditTracking(entry, 'wlSales', 'wl_sales_tracking');
    const handleDeleteWLSales = (id: string) => handleDeleteTracking(id, 'wlSales', 'wl_sales_tracking');

    const handleAddInfluencer = (data: any) => handleAddTracking(data, 'influencerTracking', 'influencer_tracking');
    const handleEditInfluencer = (entry: InfluencerTrackingEntry) => handleEditTracking(entry, 'influencerTracking', 'influencer_tracking');
    const handleDeleteInfluencer = (id: string) => handleDeleteTracking(id, 'influencerTracking', 'influencer_tracking');

    const handleAddEvent = (data: any) => handleAddTracking(data, 'eventTracking', 'event_tracking');
    const handleEditEvent = (entry: EventTrackingEntry) => handleEditTracking(entry, 'eventTracking', 'event_tracking');
    const handleDeleteEvent = (id: string) => handleDeleteTracking(id, 'eventTracking', 'event_tracking');

    const handleAddPaidTraffic = (data: any) => handleAddTracking(data, 'paidTraffic', 'paid_traffic_tracking');
    const handleEditPaidTraffic = (entry: PaidTrafficEntry) => handleEditTracking(entry, 'paidTraffic', 'paid_traffic_tracking');
    const handleDeletePaidTraffic = (id: string) => handleDeleteTracking(id, 'paidTraffic', 'paid_traffic_tracking');

    const handleAddDemo = (data: any) => handleAddTracking(data, 'demoTracking', 'demo_tracking');
    const handleEditDemo = (entry: DemoTrackingEntry) => handleEditTracking(entry, 'demoTracking', 'demo_tracking');
    const handleDeleteDemo = (id: string) => handleDeleteTracking(id, 'demoTracking', 'demo_tracking');

    const handleUpdateGameGeneralInfo = async (gameId: string, updates: Partial<SupabaseGame>) => {
        try {
            await updateGame(gameId, updates);
            invalidateGames();
            toast.success("Informações gerais do jogo atualizadas.");
        } catch (error) {
            toast.error(`Falha ao atualizar informações do jogo: ${error.message}`);
        }
    };

    const handleDeleteGame = async (gameId: string) => {
        try {
            await deleteGame(gameId);
            invalidateGames();
            setSelectedGame(games.filter(g => g !== selectedGame)[0] || '');
            toast.success(`Jogo "${selectedGame}" excluído permanentemente.`);
        } catch (error) {
            toast.error(`Falha ao excluir jogo: ${error.message}`);
        }
    };

    // --- AI Data Processor Handler ---
    const handleAIDataProcessed = (structuredData: any) => {
        const processAndSave = (dataArray: any[], type: keyof TrackingData, dbTable: string) => {
            dataArray.forEach(data => {
                // Ensure dates are converted back to Date objects for local state consistency
                const entry = {
                    ...data,
                    game: selectedGame,
                    date: data.date ? new Date(data.date) : undefined,
                    startDate: data.startDate ? new Date(data.startDate) : undefined,
                    endDate: data.endDate ? new Date(data.endDate) : undefined,
                };
                handleAddTracking(entry, type, dbTable);
            });
        };

        processAndSave(structuredData.wlSales, 'wlSales', 'wl_sales_tracking');
        processAndSave(structuredData.influencerTracking, 'influencerTracking', 'influencer_tracking');
        processAndSave(structuredData.eventTracking, 'eventTracking', 'event_tracking');
        processAndSave(structuredData.paidTraffic, 'paidTraffic', 'paid_traffic_tracking');
        processAndSave(structuredData.demoTracking, 'demoTracking', 'demo_tracking');
        processAndSave(structuredData.trafficTracking, 'trafficTracking', 'traffic_tracking');
        processAndSave(structuredData.manualEventMarkers, 'manualEventMarkers', 'manual_event_markers');

        setIsAIDataProcessorOpen(false);
        toast.success("Todos os dados processados pela IA foram inseridos no dashboard.");
    };

    // --- UI Handlers ---

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.info("Sessão encerrada.");
    };

    const handleWLSalesPointClick = (entry: WLSalesPlatformEntry) => {
        setSelectedWLSalesEntry(entry);
        setIsActionMenuOpen(true);
    };

    const handleWlConversionCardClick = (tab: 'wl-sales' | 'traffic') => {
        if (isMobile) {
            setActiveTab(tab);
        }
    };

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center gaming-background">
                <Loader2 className="h-10 w-10 animate-spin text-gogo-cyan" />
            </div>
        );
    }

    if (!session) {
        return <div className="min-h-screen flex items-center justify-center gaming-background">Redirecionando para Login...</div>;
    }

    if (games.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 gaming-background">
                <Card className="w-full max-w-md text-center p-8 shadow-gogo-orange-glow">
                    <CardTitle className="text-2xl mb-4">Bem-vindo!</CardTitle>
                    <CardContent>
                        <p className="mb-6 text-muted-foreground">Nenhum jogo encontrado. Comece adicionando seu primeiro jogo.</p>
                        <Button 
                            onClick={() => setIsAddGameModalOpen(true)} 
                            className="bg-gogo-cyan hover:bg-gogo-cyan/90"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Adicionar Novo Jogo
                        </Button>
                    </CardContent>
                </Card>
                <Button onClick={handleLogout} variant="ghost" className="mt-8 text-muted-foreground">
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                </Button>
                <AddGameModal 
                    isOpen={isAddGameModalOpen}
                    onClose={() => setIsAddGameModalOpen(false)}
                    onSave={async (gameName, launchDate, suggestedPrice, capsuleImageUrl) => {
                        try {
                            await addGame(gameName, launchDate, suggestedPrice, capsuleImageUrl);
                            invalidateGames();
                            setSelectedGame(gameName);
                            setIsAddGameModalOpen(false);
                            toast.success(`Jogo "${gameName}" adicionado com sucesso!`);
                        } catch (error) {
                            toast.error(`Falha ao adicionar jogo: ${error.message}`);
                        }
                    }}
                />
            </div>
        );
    }

    if (!selectedGame) {
        return <div className="min-h-screen flex items-center justify-center gaming-background">Selecione um jogo...</div>;
    }

    // --- Chart Colors ---
    const chartColors = {
        daily: '#00BFFF', // Gogo Cyan
        weekly: '#FF6600', // Gogo Orange
        monthly: '#8b5cf6', // Violet
        event: '#FF6600', // Gogo Orange for event markers
        sales: '#00BFFF', // Gogo Cyan for sales line
    };

    // --- Main Layout Render Functions ---

    const renderContent = (tab: string) => {
        switch (tab) {
            case 'summary':
                return (
                    <div className="space-y-6">
                        <GameSummaryPanel 
                            gameId={selectedGameData?.id || 'local'}
                            gameName={selectedGame}
                            totalSales={totalCalculations.totalSales}
                            totalWishlists={totalCalculations.totalWishlists}
                            totalInvestment={totalCalculations.totalInvestment}
                            totalInfluencerViews={totalCalculations.totalInfluencerViews}
                            totalEventViews={totalCalculations.totalEventViews}
                            totalImpressions={totalCalculations.totalImpressions}
                            launchDate={selectedGameData?.launch_date ? new Date(selectedGameData.launch_date) : null}
                            suggestedPrice={selectedGameData?.suggested_price || 0}
                            capsuleImageUrl={selectedGameData?.capsule_image_url || null}
                            priceUsd={selectedGameData?.price_usd || null}
                            developer={selectedGameData?.developer || null}
                            publisher={selectedGameData?.publisher || null}
                            reviewSummary={selectedGameData?.review_summary || null}
                            investmentSources={totalCalculations.investmentSources}
                            onUpdateGeneralInfo={handleUpdateGameGeneralInfo}
                        />
                        <WlConversionKpisPanel 
                            avgDailyGrowth={kpis.avgDailyGrowth}
                            totalGrowth={kpis.totalGrowth}
                            timeFrame={timeFrame}
                            onTimeFrameChange={setTimeFrame}
                            visitorToWlConversionRate={kpis.visitorToWlConversionRate}
                            wlToSalesConversionRate={kpis.wlToSalesConversionRate}
                            onCardClick={handleWlConversionCardClick}
                        />
                        <ResultSummaryPanel 
                            data={resultSummary.filter(r => r.game === selectedGame)} 
                        />
                        <WlDetailsManager 
                            details={wlDetails.find(d => d.game === selectedGame) || { game: selectedGame, reviews: [], bundles: [], traffic: [] }}
                            gameName={selectedGame}
                            allGames={games}
                            onUpdateDetails={(game, newDetails) => {
                                // Simulate update to local wlDetails state
                                console.log('Simulating update to wlDetails:', game, newDetails);
                                invalidateAll();
                            }}
                            onAddTraffic={(data) => handleAddTracking(data, 'trafficTracking', 'traffic_tracking')}
                        />
                    </div>
                );
            case 'wl-sales':
                return (
                    <div className="space-y-6">
                        <WLSalesChartPanel 
                            data={wlSales} 
                            onPointClick={handleWLSalesPointClick}
                            eventTracking={eventTracking}
                            manualEventMarkers={manualEventMarkers}
                            chartColors={chartColors}
                        />
                        <WlComparisonsPanel 
                            data={wlSales} 
                            allPlatforms={allPlatforms}
                        />
                        <WLSalesTablePanel 
                            data={wlSales} 
                            onDelete={handleDeleteWLSales}
                            onEdit={handleEditWLSales}
                            games={games}
                        />
                    </div>
                );
            case 'traffic':
                return (
                    <div className="space-y-6">
                        <PaidTrafficPanel 
                            data={paidTraffic} 
                            onDeleteTracking={handleDeletePaidTraffic}
                            onEditTracking={handleEditPaidTraffic}
                            games={games}
                        />
                        <InfluencerPanel 
                            summary={influencerSummary.filter(s => s.game === selectedGame)}
                            tracking={influencerTracking}
                            onDeleteTracking={handleDeleteInfluencer}
                            onEditTracking={handleEditInfluencer}
                            games={games}
                        />
                        <EventPanel 
                            data={eventTracking} 
                            onDeleteTracking={handleDeleteEvent}
                            onEditTracking={handleEditEvent}
                            games={games}
                        />
                        <DemoTrackingPanel 
                            data={demoTracking} 
                            onDeleteTracking={handleDeleteDemo}
                            onEditTracking={handleEditDemo}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    const renderDesktopLayout = () => (
        <ResizablePanelGroup direction="horizontal" className="min-h-[85vh] rounded-lg border">
            {/* Panel 1: Summary & KPIs */}
            <ResizablePanel defaultSize={30} minSize={25} className="p-4 space-y-6">
                {renderContent('summary')}
            </ResizablePanel>
            <ResizableHandle withHandle />
            
            {/* Panel 2: Charts */}
            <ResizablePanel defaultSize={40} minSize={30} className="p-4 space-y-6">
                {renderContent('wl-sales')}
            </ResizablePanel>
            <ResizableHandle withHandle />

            {/* Panel 3: Tables (Traffic/Events/Influencers) */}
            <ResizablePanel defaultSize={30} minSize={25} className="p-4 space-y-6">
                {renderContent('traffic')}
            </ResizablePanel>
        </ResizablePanelGroup>
    );

    const renderMobileLayout = () => (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b">
                <TabsTrigger value="summary" className="flex items-center">
                    <List className="h-4 w-4 mr-1" /> Resumo
                </TabsTrigger>
                <TabsTrigger value="wl-sales" className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" /> WL/Vendas
                </TabsTrigger>
                <TabsTrigger value="traffic" className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" /> Tráfego
                </TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="mt-4 p-0">
                {renderContent('summary')}
            </TabsContent>
            <TabsContent value="wl-sales" className="mt-4 p-0">
                {renderContent('wl-sales')}
            </TabsContent>
            <TabsContent value="traffic" className="mt-4 p-0">
                {renderContent('traffic')}
            </TabsContent>
        </Tabs>
    );

    return (
        <div className="min-h-screen p-4 md:p-8 font-sans gaming-background">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
                    <h1 className="text-3xl font-extrabold text-gogo-cyan drop-shadow-md">
                        Gogo Games Dashboard
                    </h1>
                    <div className="flex items-center space-x-2">
                        <Select onValueChange={setSelectedGame} value={selectedGame}>
                            <SelectTrigger className="w-[200px] bg-card">
                                <SelectValue placeholder="Selecione o Jogo" />
                            </SelectTrigger>
                            <SelectContent>
                                {games.map(game => (
                                    <SelectItem key={game} value={game}>{game}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={() => setIsAddGameModalOpen(true)} variant="outline" size="icon" className="text-gogo-orange hover:bg-gogo-orange/10">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    {profile?.role === 'admin' && (
                        <Button onClick={() => window.location.href = '/admin'} variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" /> Admin
                        </Button>
                    )}
                    <ThemeToggle />
                    <Button onClick={handleLogout} variant="outline" size="sm">
                        <LogOut className="h-4 w-4 mr-2" /> Sair
                    </Button>
                </div>
            </header>

            {/* Action Bar */}
            <div className="mb-6 p-4 border rounded-lg bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-foreground">Adicionar Nova Entrada:</h2>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => setIsAddWLSalesFormOpen(true)} variant="secondary" size="sm">
                            <List className="h-4 w-4 mr-2" /> WL/Vendas
                        </Button>
                        <Button onClick={() => setIsAddInfluencerFormOpen(true)} variant="secondary" size="sm">
                            <Megaphone className="h-4 w-4 mr-2" /> Influencer
                        </Button>
                        <Button onClick={() => setIsAddEventFormOpen(true)} variant="secondary" size="sm">
                            <CalendarDays className="h-4 w-4 mr-2" /> Evento
                        </Button>
                        <Button onClick={() => setIsAddPaidTrafficFormOpen(true)} variant="secondary" size="sm">
                            <DollarSign className="h-4 w-4 mr-2" /> Tráfego Pago
                        </Button>
                        <Button onClick={() => setIsAddDemoFormOpen(true)} variant="secondary" size="sm">
                            <Clock className="h-4 w-4 mr-2" /> Demo
                        </Button>
                        <Button onClick={() => setIsAddTrafficFormOpen(true)} variant="secondary" size="sm">
                            <Globe className="h-4 w-4 mr-2" /> Tráfego Manual
                        </Button>
                        <Button onClick={() => setIsAIDataProcessorOpen(true)} className="bg-gogo-orange hover:bg-gogo-orange/90 text-white" size="sm">
                            <Bot className="h-4 w-4 mr-2" /> Processar Dados IA
                        </Button>
                    </div>
                </div>
                {selectedGameData && (
                    <DeleteGameButton 
                        gameId={selectedGameData.id} 
                        gameName={selectedGame} 
                        onDelete={handleDeleteGame}
                    />
                )}
            </div>

            {/* Main Content Area */}
            {isMobile ? renderMobileLayout() : renderDesktopLayout()}

            {/* --- Modals --- */}

            {/* Modal de Adicionar Jogo */}
            <AddGameModal 
                isOpen={isAddGameModalOpen}
                onClose={() => setIsAddGameModalOpen(false)}
                onSave={async (gameName, launchDate, suggestedPrice, capsuleImageUrl) => {
                    try {
                        await addGame(gameName, launchDate, suggestedPrice, capsuleImageUrl);
                        invalidateGames();
                        setSelectedGame(gameName);
                        setIsAddGameModalOpen(false);
                        toast.success(`Jogo "${gameName}" adicionado com sucesso!`);
                    } catch (error) {
                        toast.error(`Falha ao adicionar jogo: ${error.message}`);
                    }
                }}
            />

            {/* Modal de Processamento de Dados por IA */}
            <Dialog open={isAIDataProcessorOpen} onOpenChange={setIsAIDataProcessorOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Processamento de Dados por IA</DialogTitle>
                    </DialogHeader>
                    <AIDataProcessor 
                        gameName={selectedGame}
                        onDataProcessed={handleAIDataProcessed}
                        onClose={() => setIsAIDataProcessorOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Modal de Ação de WL/Vendas (Menu de Edição/Resumo Diário) */}
            <Dialog open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    {selectedWLSalesEntry && (
                        <WLSalesActionMenu 
                            entry={selectedWLSalesEntry}
                            existingMarker={manualEventMarkers.find(m => 
                                m.date && selectedWLSalesEntry.date && startOfDay(m.date).getTime() === startOfDay(selectedWLSalesEntry.date).getTime()
                            )}
                            gameName={selectedGame}
                            onEditWLSales={handleEditWLSales}
                            onSaveManualMarker={(values) => handleAddTracking({ ...values, date: new Date(values.date) }, 'manualEventMarkers', 'manual_event_markers')}
                            onDeleteManualMarker={(id) => handleDeleteTracking(id, 'manualEventMarkers', 'manual_event_markers')}
                            onClose={() => setIsActionMenuOpen(false)}
                            allWLSales={wlSales}
                            allInfluencerTracking={influencerTracking}
                            allEventTracking={eventTracking}
                            allPaidTraffic={paidTraffic}
                            allDemoTracking={demoTracking}
                            allManualEventMarkers={manualEventMarkers}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Gerenciamento de Detalhes de WL (Reviews/Bundles/Traffic Manual) */}
            <Dialog open={isWlDetailsManagerOpen} onOpenChange={setIsWlDetailsManagerOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Gerenciar Detalhes da Página Steam</DialogTitle>
                    </DialogHeader>
                    {selectedGame && (
                        <WlDetailsManager 
                            details={wlDetails.find(d => d.game === selectedGame) || {
                                game: selectedGame,
                                reviews: [],
                                bundles: [],
                                traffic: [],
                            }}
                            gameName={selectedGame}
                            allGames={games}
                            onUpdateDetails={(game, newDetails) => {
                                // Simulate update to local wlDetails state
                                console.log('Simulating update to wlDetails:', game, newDetails);
                                invalidateAll();
                            }}
                            onAddTraffic={(data) => handleAddTracking(data, 'trafficTracking', 'traffic_tracking')}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Formulários Modais de Adição */}
            <Dialog open={isAddWLSalesFormOpen} onOpenChange={setIsAddWLSalesFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Dados de WL/Vendas</DialogTitle>
                    </DialogHeader>
                    <AddWLSalesForm 
                        games={[selectedGame]}
                        onSave={handleAddWLSales}
                        onClose={() => setIsAddWLSalesFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isAddInfluencerFormOpen} onOpenChange={setIsAddInfluencerFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Tracking de Influencer</DialogTitle>
                    </DialogHeader>
                    <AddInfluencerForm 
                        games={[selectedGame]}
                        onSave={handleAddInfluencer}
                        onClose={() => setIsAddInfluencerFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isAddEventFormOpen} onOpenChange={setIsAddEventFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Tracking de Evento</DialogTitle>
                    </DialogHeader>
                    <AddEventForm 
                        games={[selectedGame]}
                        onSave={handleAddEvent}
                        onClose={() => setIsAddEventFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isAddPaidTrafficFormOpen} onOpenChange={setIsAddPaidTrafficFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Tráfego Pago</DialogTitle>
                    </DialogHeader>
                    <AddPaidTrafficForm 
                        games={[selectedGame]}
                        onSave={handleAddPaidTraffic}
                        onClose={() => setIsAddPaidTrafficFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isAddDemoFormOpen} onOpenChange={setIsAddDemoFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Tracking de Demo</DialogTitle>
                    </DialogHeader>
                    <AddDemoForm 
                        gameName={selectedGame}
                        onSave={handleAddDemo}
                        onClose={() => setIsAddDemoFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
            
            <Dialog open={isAddTrafficFormOpen} onOpenChange={setIsAddTrafficFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Tráfego/Visitas Manuais</DialogTitle>
                    </DialogHeader>
                    <AddTrafficForm 
                        games={[selectedGame]}
                        onSave={(data) => handleAddTracking(data, 'trafficTracking', 'traffic_tracking')}
                        onClose={() => setIsAddTrafficFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Dashboard;