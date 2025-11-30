import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import {
  RawTrackingData,
  WLSalesEntry,
  Platform,
  initialRawData,
  AllPlatforms,
  PlatformSchema,
  ALL_PLATFORMS_WITH_ALL,
  TrafficEntry,
  WlDetails,
  InfluencerTrackingEntry, // Added missing imports
  EventTrackingEntry,
  PaidTrafficEntry,
  DemoTrackingEntry,
} from '@/data/trackingData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card'; // Import Card
import { toast } from 'sonner';
import { Plus, RefreshCw, Settings, BarChart3, TrendingUp, DollarSign, List, Clock } from 'lucide-react';
import { startOfDay, isBefore, isEqual, parseISO } from 'date-fns';

// Panels (Importing as default, assuming they are default exports)
import WLSalesPanelThemed from '@/components/dashboard/WLSalesPanelThemed';
import InfluencerPanel from '@/components/dashboard/InfluencerPanel';
import EventPanel from '@/components/dashboard/EventPanel';
import PaidTrafficPanel from '@/components/dashboard/PaidTrafficPanel';
import DemoTrackingPanel from '@/components/dashboard/DemoTrackingPanel';
import DailySummaryPanel from '@/components/dashboard/DailySummaryPanel';
import WlConversionKpisPanel from '@/components/dashboard/WlConversionKpisPanel';
import WlComparisonsPanel from '@/components/dashboard/WlComparisonsPanel';
import WlDetailsManager from '@/components/dashboard/WlDetailsManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import LaunchTimer from '@/components/dashboard/LaunchTimer';
import AnimatedPanel from '@/components/dashboard/AnimatedPanel';
import AIDataPreview from '@/components/dashboard/AIDataPreview';

// Data Management
import {
  fetchTrackingData,
  saveTrackingData,
  addWLSalesEntry,
  addTrafficEntry,
  addInfluencerEntry,
  addEventEntry,
  addPaidTrafficEntry,
  addDemoTrackingEntry,
  updateWlDetails,
  deleteEntry,
} from '@/integrations/supabase/tracking';
import { fetchGamesByStudio, GameOption } from '@/integrations/supabase/games';
import { GameMetrics } from '@/data/trackingData';

// --- Constants ---
const ALL_PLATFORMS: AllPlatforms[] = ALL_PLATFORMS_WITH_ALL as unknown as AllPlatforms[];

// --- Utility Functions ---

/**
 * Filters tracking data based on the selected game and platform.
 */
const filterTrackingData = (data: RawTrackingData, gameName: string, platform: AllPlatforms): RawTrackingData => {
  const isAllPlatforms = platform === 'All';

  const filterByGameAndPlatform = <T extends { game: string; platform: Platform }>(arr: T[]): T[] => {
    return arr.filter(entry =>
      entry.game.trim() === gameName &&
      (isAllPlatforms || entry.platform === platform)
    );
  };

  const filterByGame = <T extends { game: string }>(arr: T[]): T[] => {
    return arr.filter(entry => entry.game.trim() === gameName);
  };

  return {
    wlSales: filterByGameAndPlatform(data.wlSales),
    influencers: filterByGameAndPlatform(data.influencers),
    events: filterByGameAndPlatform(data.events),
    paidTraffic: filterByGameAndPlatform(data.paidTraffic),
    demoTracking: filterByGameAndPlatform(data.demoTracking),
    traffic: filterByGameAndPlatform(data.traffic),
    manualEvents: filterByGame(data.manualEvents),
    wlDetails: filterByGame(data.wlDetails),
  };
};

const Dashboard = () => {
  const { isAdmin, studioId, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();

  const [trackingData, setTrackingData] = useState<RawTrackingData>(initialRawData);
  const [games, setGames] = useState<GameMetrics[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<AllPlatforms>('All');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Derived state
  const selectedGame = useMemo(() => games.find(g => g.id === selectedGameId) || null, [games, selectedGameId]);
  const selectedGameName = useMemo(() => selectedGame?.name.trim() || '', [selectedGame]);
  const selectedWlDetails = useMemo(() => trackingData.wlDetails.find(d => d.game.trim() === selectedGameName), [trackingData.wlDetails, selectedGameName]);

  const filteredData = useMemo(() => {
    if (!selectedGameName) return initialRawData;
    return filterTrackingData(trackingData, selectedGameName, selectedPlatform);
  }, [trackingData, selectedGameName, selectedPlatform]);

  const wlSalesDataForRecalculation = useMemo(() => {
    // We need ALL platform data for the selected game to calculate daily summaries and KPIs correctly
    if (!selectedGameName) return [];
    return trackingData.wlSales.filter(e => e.game.trim() === selectedGameName);
  }, [trackingData.wlSales, selectedGameName]);

  const launchDate = useMemo(() => {
    if (selectedGame?.launch_date) {
      try {
        return parseISO(selectedGame.launch_date);
      } catch (e) {
        console.error("Invalid launch date format:", selectedGame.launch_date);
        return null;
      }
    }
    return null;
  }, [selectedGame?.launch_date]);

  // --- Data Fetching ---

  const loadGames = useCallback(async (sId: string) => {
    const fetchedGames = await fetchGamesByStudio(sId);
    if (fetchedGames && fetchedGames.length > 0) {
      setGames(fetchedGames);
      // If no game is selected, select the first one
      if (!selectedGameId) {
        setSelectedGameId(fetchedGames[0].id);
      }
    } else {
      setGames([]);
      setSelectedGameId(null);
    }
  }, [selectedGameId]);

  const loadTrackingData = useCallback(async (sId: string) => {
    if (!sId) return;
    setIsLoadingData(true);
    const data = await fetchTrackingData(sId);
    if (data) {
      setTrackingData(data);
    }
    setIsLoadingData(false);
  }, []);

  useEffect(() => {
    if (!isSessionLoading && studioId) {
      loadGames(studioId);
      loadTrackingData(studioId);
    } else if (!isSessionLoading && !studioId) {
      // User is authenticated but has no studio (shouldn't happen if profile creation is correct)
      toast.error("Usuário não associado a um estúdio.");
    }
  }, [isSessionLoading, studioId, loadGames, loadTrackingData]);

  // --- Data Handlers ---

  const handleSaveData = useCallback(async () => {
    if (!studioId) return;
    setIsSaving(true);
    const success = await saveTrackingData(studioId, trackingData);
    if (success) {
      toast.success("Dados salvos com sucesso!");
    }
    setIsSaving(false);
  }, [studioId, trackingData]);

  const handleAddDailyWLSalesEntry = useCallback(async (entry: Omit<WLSalesEntry, 'id' | 'game'>) => {
    if (!selectedGameName || !studioId) return;

    const newEntry: Omit<WLSalesEntry, 'id'> = {
      ...entry,
      game: selectedGameName,
    };

    const addedEntry = await addWLSalesEntry(studioId, newEntry);
    if (addedEntry) {
      setTrackingData(prev => ({
        ...prev,
        wlSales: [...prev.wlSales, addedEntry],
      }));
      toast.success(`Entrada de WL/Vendas (${addedEntry.platform}) adicionada.`);
    }
  }, [selectedGameName, studioId]);

  const handleAddTrafficEntry = useCallback(async (entry: Omit<TrafficEntry, 'id'>) => {
    if (!selectedGameName || !studioId) return;

    const addedEntry = await addTrafficEntry(studioId, entry);
    if (addedEntry) {
      setTrackingData(prev => ({
        ...prev,
        traffic: [...prev.traffic, addedEntry],
      }));
      toast.success(`Entrada de Tráfego (${addedEntry.source}) adicionada.`);
    }
  }, [selectedGameName, studioId]);

  const handleAddInfluencerEntry = useCallback(async (entry: Omit<InfluencerTrackingEntry, 'id' | 'game'>) => {
    if (!selectedGameName || !studioId) return;

    const newEntry: Omit<InfluencerTrackingEntry, 'id'> = {
      ...entry,
      game: selectedGameName,
    };

    const addedEntry = await addInfluencerEntry(studioId, newEntry);
    if (addedEntry) {
      setTrackingData(prev => ({
        ...prev,
        influencers: [...prev.influencers, addedEntry],
      }));
      toast.success(`Influencer (${addedEntry.influencer}) adicionado.`);
    }
  }, [selectedGameName, studioId]);

  const handleAddEventEntry = useCallback(async (entry: Omit<EventTrackingEntry, 'id' | 'game'>) => {
    if (!selectedGameName || !studioId) return;

    const newEntry: Omit<EventTrackingEntry, 'id'> = {
      ...entry,
      game: selectedGameName,
    };

    const addedEntry = await addEventEntry(studioId, newEntry);
    if (addedEntry) {
      setTrackingData(prev => ({
        ...prev,
        events: [...prev.events, addedEntry],
      }));
      toast.success(`Evento (${addedEntry.event}) adicionado.`);
    }
  }, [selectedGameName, studioId]);

  const handleAddPaidTrafficEntry = useCallback(async (entry: Omit<PaidTrafficEntry, 'id' | 'game'>) => {
    if (!selectedGameName || !studioId) return;

    const newEntry: Omit<PaidTrafficEntry, 'id'> = {
      ...entry,
      game: selectedGameName,
    };

    const addedEntry = await addPaidTrafficEntry(studioId, newEntry);
    if (addedEntry) {
      setTrackingData(prev => ({
        ...prev,
        paidTraffic: [...prev.paidTraffic, addedEntry],
      }));
      toast.success(`Tráfego Pago (${addedEntry.network}) adicionado.`);
    }
  }, [selectedGameName, studioId]);

  const handleAddDemoTrackingEntry = useCallback(async (entry: Omit<DemoTrackingEntry, 'id' | 'game'>) => {
    if (!selectedGameName || !studioId) return;

    const newEntry: Omit<DemoTrackingEntry, 'id'> = {
      ...entry,
      game: selectedGameName,
    };

    const addedEntry = await addDemoTrackingEntry(studioId, newEntry);
    if (addedEntry) {
      setTrackingData(prev => ({
        ...prev,
        demoTracking: [...prev.demoTracking, addedEntry],
      }));
      toast.success(`Tracking de Demo (${addedEntry.platform}) adicionado.`);
    }
  }, [selectedGameName, studioId]);

  const handleUpdateWlDetails = useCallback(async (updatedDetails: WlDetails) => {
    if (!studioId) return;

    const updated = await updateWlDetails(studioId, updatedDetails);
    if (updated) {
      setTrackingData(prev => ({
        ...prev,
        wlDetails: prev.wlDetails.map(d => d.game === updated.game ? updated : d),
      }));
      toast.success("Detalhes do Wishlist atualizados.");
    }
  }, [studioId]);

  const handleDeleteEntry = useCallback(async (type: keyof RawTrackingData, id: string) => {
    if (!studioId) return;

    const success = await deleteEntry(studioId, type, id);
    if (success) {
      setTrackingData(prev => ({
        ...prev,
        [type]: (prev[type] as any[]).filter(e => e.id !== id),
      }));
      toast.success("Entrada removida com sucesso.");
    }
  }, [studioId]);

  // --- Render Logic ---

  if (isSessionLoading || isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gogo-cyan mx-auto" />
          <p className="mt-4 text-lg text-gray-600">Carregando dados do estúdio...</p>
        </div>
      </div>
    );
  }

  if (!studioId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex-grow flex items-center justify-center">
                <Card className="p-6 shadow-xl border border-border">
                    <h1 className="text-2xl font-bold mb-4 text-gogo-cyan">Dashboard de Rastreamento</h1>
                    <p className="text-gray-600 mb-6">
                        Você precisa estar logado e associado a um estúdio para acessar o dashboard.
                    </p>
                    <Button onClick={() => navigate('/login')} className="w-full bg-gogo-cyan hover:bg-gogo-cyan/90">
                        Ir para Login
                    </Button>
                </Card>
            </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <DashboardHeader />
        <Card className="p-6 mt-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gogo-orange mb-4">Nenhum Jogo Encontrado</h2>
          <p className="text-gray-600 mb-6">
            Seu estúdio não possui jogos cadastrados. Por favor, adicione um jogo para começar a rastrear dados.
          </p>
          {/* Placeholder for Add Game functionality */}
          <Button onClick={() => toast.info("Funcionalidade de adicionar jogo em desenvolvimento.")} className="bg-gogo-cyan hover:bg-gogo-cyan/90">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Novo Jogo
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <h1 className="text-3xl font-extrabold text-gray-800">
            Dashboard de Rastreamento
          </h1>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/strategic')}
              className="text-gogo-orange border-gogo-orange hover:bg-gogo-orange/10"
            >
              <BarChart3 className="h-4 w-4 mr-2" /> Visão Estratégica
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                className="text-gogo-cyan border-gogo-cyan hover:bg-gogo-cyan/10"
              >
                <Settings className="h-4 w-4 mr-2" /> Admin
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Game Selector */}
          <Card className="p-4 col-span-1">
            <div className="flex items-center space-x-2 mb-2">
              <List className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-700">Jogo Selecionado</p>
            </div>
            <Select
              value={selectedGameId || ''}
              onValueChange={(id) => setSelectedGameId(id)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um Jogo" />
              </SelectTrigger>
              <SelectContent>
                {games.map(game => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Platform Filter */}
          <Card className="p-4 col-span-1">
            <div className="flex items-center space-x-2 mb-2">
              <List className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-700">Filtro de Plataforma</p>
            </div>
            <Select
              value={selectedPlatform}
              onValueChange={(p) => setSelectedPlatform(p as AllPlatforms)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas as Plataformas" />
              </SelectTrigger>
              <SelectContent>
                {ALL_PLATFORMS.map(p => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Launch Timer */}
          <div className="col-span-1">
            <LaunchTimer launchDate={launchDate} />
          </div>

          {/* Save Button */}
          <div className="col-span-1 flex flex-col justify-end">
            <Button
              onClick={handleSaveData}
              disabled={isSaving}
              className="w-full h-full bg-gogo-green hover:bg-gogo-green/90 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "Salvando..." : "Salvar Dados"}
            </Button>
          </div>
        </div>

        {selectedGameName && (
          <Tabs defaultValue="wl_sales" className="w-full">
            <TabsList className="grid w-full grid-cols-6 md:grid-cols-10 h-auto">
              <TabsTrigger value="wl_sales">WL/Vendas</TabsTrigger>
              <TabsTrigger value="kpis">KPIs</TabsTrigger>
              <TabsTrigger value="daily_summary">Resumo Diário</TabsTrigger>
              <TabsTrigger value="influencers">Influencers</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
              <TabsTrigger value="paid_traffic">Tráfego Pago</TabsTrigger>
              <TabsTrigger value="demo_tracking">Demo</TabsTrigger>
              <TabsTrigger value="traffic">Tráfego Geral</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="ai_preview">AI Preview</TabsTrigger>
            </TabsList>

            {/* WL/Sales Tab */}
            <TabsContent value="wl_sales" className="mt-4 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AnimatedPanel delay={0}>
                  <WLSalesPanelThemed
                    wlSalesData={filteredData.wlSales}
                    gameName={selectedGameName}
                    allPlatforms={ALL_PLATFORMS.filter(p => p !== 'All') as Platform[]}
                    onAddDailyWLSalesEntry={handleAddDailyWLSalesEntry}
                    onDeleteEntry={(id) => handleDeleteEntry('wlSales', id)}
                  />
                </AnimatedPanel>
                <AnimatedPanel delay={0.1}>
                  <WlComparisonsPanel data={wlSalesDataForRecalculation.filter(e => e.game.trim() === selectedGameName)} allPlatforms={ALL_PLATFORMS.filter(p => p !== 'All') as Platform[]} />
                </AnimatedPanel>
              </div>
            </TabsContent>

            {/* KPIs Tab */}
            <TabsContent value="kpis" className="mt-4 space-y-6">
              <AnimatedPanel delay={0}>
                <WlConversionKpisPanel
                  wlSalesData={wlSalesDataForRecalculation}
                  gameName={selectedGameName}
                />
              </AnimatedPanel>
            </TabsContent>

            {/* Daily Summary Tab */}
            <TabsContent value="daily_summary" className="mt-4 space-y-6">
              <AnimatedPanel delay={0}>
                <DailySummaryPanel
                  wlSalesData={wlSalesDataForRecalculation}
                  manualEvents={filteredData.manualEvents}
                  gameName={selectedGameName}
                />
              </AnimatedPanel>
            </TabsContent>

            {/* Influencers Tab */}
            <TabsContent value="influencers" className="mt-4 space-y-6">
              <AnimatedPanel delay={0}>
                <InfluencerPanel
                  influencerData={filteredData.influencers}
                  gameName={selectedGameName}
                  onAddEntry={handleAddInfluencerEntry}
                  onDeleteEntry={(id) => handleDeleteEntry('influencers', id)}
                />
              </AnimatedPanel>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="mt-4 space-y-6">
              <AnimatedPanel delay={0}>
                <EventPanel
                  eventData={filteredData.events}
                  gameName={selectedGameName}
                  onAddEntry={handleAddEventEntry}
                  onDeleteEntry={(id) => handleDeleteEntry('events', id)}
                />
              </AnimatedPanel>
            </TabsContent>

            {/* Paid Traffic Tab */}
            <TabsContent value="paid_traffic" className="mt-4 space-y-6">
              <AnimatedPanel delay={0}>
                <PaidTrafficPanel
                  paidTrafficData={filteredData.paidTraffic}
                  gameName={selectedGameName}
                  onAddEntry={handleAddPaidTrafficEntry}
                  onDeleteEntry={(id) => handleDeleteEntry('paidTraffic', id)}
                />
              </AnimatedPanel>
            </TabsContent>

            {/* Demo Tracking Tab */}
            <TabsContent value="demo_tracking" className="mt-4 space-y-6">
              <AnimatedPanel delay={0}>
                <DemoTrackingPanel
                  demoTrackingData={filteredData.demoTracking}
                  gameName={selectedGameName}
                  onAddEntry={handleAddDemoTrackingEntry}
                  onDeleteEntry={(id) => handleDeleteEntry('demoTracking', id)}
                />
              </AnimatedPanel>
            </TabsContent>

            {/* Traffic Tab (Manual) */}
            <TabsContent value="traffic" className="mt-4 space-y-6">
              <AnimatedPanel delay={0}>
                <WlDetailsManager
                  wlDetails={selectedWlDetails}
                  gameName={selectedGameName}
                  onUpdateWlDetails={handleUpdateWlDetails}
                  onAddTraffic={handleAddTrafficEntry}
                />
              </AnimatedPanel>
            </TabsContent>

            {/* Details Tab (Reviews/Bundles/Traffic) */}
            <TabsContent value="details" className="mt-4 space-y-6">
              <AnimatedPanel delay={0}>
                <WlDetailsManager
                  wlDetails={selectedWlDetails}
                  gameName={selectedGameName}
                  onUpdateWlDetails={handleUpdateWlDetails}
                  onAddTraffic={handleAddTrafficEntry}
                />
              </AnimatedPanel>
            </TabsContent>

            {/* AI Preview Tab */}
            <TabsContent value="ai_preview" className="mt-4 space-y-6">
              <AnimatedPanel delay={0}>
                <AIDataPreview
                  data={filteredData}
                  gameName={selectedGameName}
                />
              </AnimatedPanel>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Dashboard;