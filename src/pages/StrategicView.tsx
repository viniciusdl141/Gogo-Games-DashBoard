import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import {
    GameMetrics,
    EstimatedGame,
    ComparisonGame,
    RawTrackingData,
    initialRawData,
    EstimatorFormValues,
    GameEstimatorResult, // Added missing import
} from '@/data/trackingData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarChart3, TrendingUp, Search, Calculator, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';

// Components (Importing as default, assuming they are default exports)
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SimilarGamesSearch from '@/components/strategic/SimilarGamesSearch';
import GameEstimator from '@/components/strategic/GameEstimator';
import GameSalesAnalyzer from '@/components/strategic/GameSalesAnalyzer';
import GameComparisonPanel from '@/components/strategic/GameComparisonPanel';

// Data Management
import { fetchGamesByStudio } from '@/integrations/supabase/games';
import { fetchTrackingData } from '@/integrations/supabase/tracking';
import { calculateSalesAnalysis } from '@/lib/metrics';
import { invokeGameDataFetcher, GameOption } from '@/integrations/supabase/functions';

// --- Types ---
// GameOption is the type returned by the fetcher function
type GameDataResponse = GameOption[];
type Game2Selection = GameMetrics | GameOption | EstimatedGame | null;

const StrategicView: React.FC = () => {
    const { isAdmin, studioId, isLoading: isSessionLoading } = useSession();
    const navigate = useNavigate();

    const [localGames, setLocalGames] = useState<GameMetrics[]>([]);
    const [localTrackingData, setLocalTrackingData] = useState<RawTrackingData>(initialRawData);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Game 1: Local Game (for analysis and comparison)
    const [selectedLocalGameId, setSelectedLocalGameId] = useState<string | null>(null);
    const game1 = useMemo(() => localGames.find(g => g.id === selectedLocalGameId) || null, [localGames, selectedLocalGameId]);

    // Game 2: Comparison Game (can be local, searched, or estimated)
    const [game2, setGame2] = useState<Game2Selection>(null);

    // --- Data Fetching ---

    const loadData = useCallback(async (sId: string) => {
        setIsLoadingData(true);
        const [fetchedGames, fetchedTrackingData] = await Promise.all([
            fetchGamesByStudio(sId),
            fetchTrackingData(sId),
        ]);

        if (fetchedGames) {
            setLocalGames(fetchedGames);
            if (fetchedGames.length > 0 && !selectedLocalGameId) {
                setSelectedLocalGameId(fetchedGames[0].id);
            }
        }
        if (fetchedTrackingData) {
            setLocalTrackingData(fetchedTrackingData);
        }
        setIsLoadingData(false);
    }, [selectedLocalGameId]);

    useEffect(() => {
        if (!isSessionLoading && studioId) {
            loadData(studioId);
        }
    }, [isSessionLoading, studioId, loadData]);

    // --- Handlers ---

    const handleGameSearch = useCallback(async (gameName: string) => {
        // invokeGameDataFetcher returns a promise that resolves to GameDataResponse (GameOption[])
        const result: GameDataResponse = await invokeGameDataFetcher(gameName, {}); // Pass empty object for options if none are needed
        if (result && result.length > 0) {
            setGame2(result[0]); // Select the best match
            toast.success(`Dados encontrados para ${result[0].name}.`);
        } else {
            setGame2(null);
            toast.error(`Nenhum dado encontrado para "${gameName}".`);
        }
    }, []);

    const handleEstimateGame = useCallback((values: EstimatorFormValues, result: GameEstimatorResult) => {
        const estimatedGame: EstimatedGame = {
            id: `est-${Date.now()}`,
            name: 'Jogo Estimado',
            capsuleImageUrl: null,
            launchDate: null,
            suggestedPrice: values.priceBRL / 5.0, // Convert BRL to USD proxy
            totalSales: result.sales,
            totalRevenue: result.revenue,
            estimatedSales: result.sales,
            estimatedRevenue: result.revenue,
            estimationMethod: result.method,
            timeframe: result.timeframe,
            category: values.category,
            reviews: values.reviews,
            priceBRL: values.priceBRL,
        };
        setGame2(estimatedGame);
        toast.success(`Estimativa de vendas concluída usando ${result.method}.`);
    }, []);

    // --- Analysis ---

    const game1SalesAnalysis = useMemo(() => {
        if (!game1) return null;
        const wlSalesForGame = localTrackingData.wlSales.filter(e => e.game.trim() === game1.name.trim());
        return calculateSalesAnalysis(game1, wlSalesForGame);
    }, [game1, localTrackingData.wlSales]);

    // --- Render Logic ---

    if (isSessionLoading || isLoadingData) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-gogo-cyan mx-auto" />
                    <p className="mt-4 text-lg text-gray-600">Carregando dados estratégicos...</p>
                </div>
            </div>
        );
    }

    if (!studioId || localGames.length === 0) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <DashboardHeader />
                <Card className="p-6 mt-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gogo-orange mb-4">Dados Insuficientes</h2>
                    <p className="text-gray-600 mb-6">
                        Você precisa ter pelo menos um jogo cadastrado no Dashboard de Rastreamento para usar a Visão Estratégica.
                    </p>
                    <Button onClick={() => navigate('/dashboard')} className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                        <BarChart3 className="h-4 w-4 mr-2" /> Ir para Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">
                        <TrendingUp className="h-7 w-7 mr-3 text-gogo-orange" /> Visão Estratégica
                    </h1>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                        className="text-gogo-cyan border-gogo-cyan hover:bg-gogo-cyan/10"
                    >
                        <BarChart3 className="h-4 w-4 mr-2" /> Voltar ao Dashboard
                    </Button>
                </div>

                <Tabs defaultValue="analysis" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-auto">
                        <TabsTrigger value="analysis">Análise de Jogo Local</TabsTrigger>
                        <TabsTrigger value="search">Buscar Jogos Similares</TabsTrigger>
                        <TabsTrigger value="estimator">Estimador de Vendas</TabsTrigger>
                    </TabsList>

                    {/* Local Game Analysis Tab */}
                    <TabsContent value="analysis" className="mt-4 space-y-6">
                        <Card className="p-4">
                            <h2 className="text-xl font-semibold mb-4">Selecione o Jogo Local para Análise</h2>
                            <div className="flex space-x-4 items-center">
                                <select
                                    value={selectedLocalGameId || ''}
                                    onChange={(e) => setSelectedLocalGameId(e.target.value)}
                                    className="p-2 border rounded-md w-64"
                                >
                                    {localGames.map(game => (
                                        <option key={game.id} value={game.id}>
                                            {game.name}
                                        </option>
                                    ))}
                                </select>
                                {game1 && (
                                    <p className="text-sm text-gray-600">
                                        Preço Sugerido: {game1.suggested_price ? `$${game1.suggested_price.toFixed(2)}` : 'N/A'}
                                    </p>
                                )}
                            </div>
                        </Card>

                        {game1 && game1SalesAnalysis && (
                            <GameSalesAnalyzer game={game1} salesAnalysis={game1SalesAnalysis} />
                        )}
                    </TabsContent>

                    {/* Similar Games Search Tab */}
                    <TabsContent value="search" className="mt-4 space-y-6">
                        <SimilarGamesSearch onGameSelect={setGame2} onSearch={handleGameSearch} />
                    </TabsContent>

                    {/* Sales Estimator Tab */}
                    <TabsContent value="estimator" className="mt-4 space-y-6">
                        <GameEstimator />
                    </TabsContent>
                </Tabs>

                <Separator className="my-8" />

                {/* Comparison Panel */}
                <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                    <TrendingUp className="h-6 w-6 mr-2 text-gogo-orange" /> Comparação de Jogos
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Game 1: Local Game */}
                    <Card className="shadow-lg border-t-4 border-gogo-cyan">
                        <CardHeader>
                            <CardTitle className="text-xl text-gogo-cyan">Jogo 1: Jogo Local</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {game1 ? (
                                <GameComparisonPanel
                                    game1={game1 as ComparisonGame}
                                    game2={game2 as ComparisonGame}
                                    localTrackingData={localTrackingData}
                                    isGame1Local={true}
                                />
                            ) : (
                                <p className="text-gray-500">Selecione um jogo local acima.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Game 2: Comparison Target */}
                    <Card className="shadow-lg border-t-4 border-gogo-orange">
                        <CardHeader>
                            <CardTitle className="text-xl text-gogo-orange">Jogo 2: Comparação</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {game2 ? (
                                <GameComparisonPanel
                                    game1={game1 as ComparisonGame}
                                    game2={game2 as ComparisonGame}
                                    localTrackingData={localTrackingData}
                                    isGame1Local={false}
                                />
                            ) : (
                                <p className="text-gray-500">Busque um jogo similar ou use o estimador.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StrategicView;