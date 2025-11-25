"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGames, Game as SupabaseGame } from '@/integrations/supabase/games';
import { useSession } from '@/components/SessionContextProvider';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AnimatedPanel from '@/components/AnimatedPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, BarChart3, Filter, ArrowRightLeft, Loader2, Search, Calculator } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GameComparisonPanel from '@/components/strategic/GameComparisonPanel';
import SimilarGamesSearch from '@/components/strategic/SimilarGamesSearch';
import GameSalesAnalyzer from '@/components/strategic/GameSalesAnalyzer'; // NEW IMPORT
import { TrackingData, getTrackingData } from '@/data/trackingData';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { GameOption } from '@/integrations/supabase/functions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import GameEstimator, { EstimatedGame } from '@/components/strategic/GameEstimator'; // Importar Estimator

// Mock data for categories (should eventually come from DB or configuration)
const MOCK_CATEGORIES = ['Ação', 'Terror', 'RPG', 'Estratégia', 'Simulação', 'Aventura', 'Visual Novel', 'Casual', 'Outro'];

// Interface combinada para o Jogo 2 (pode ser SupabaseGame ou EstimatedGame)
type Game2Selection = SupabaseGame | GameOption | EstimatedGame | null;

const StrategicView: React.FC = () => {
    const { isAdmin, isLoading: isSessionLoading } = useSession();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [game1Id, setGame1Id] = useState<string | null>(null);
    const [game2Selection, setGame2Selection] = useState<Game2Selection>(null);
    const [isEstimatorOpen, setIsEstimatorOpen] = useState(false);
    
    // Load all games (Admin view)
    const { data: allGames, isLoading: isGamesLoading } = useQuery<SupabaseGame[], Error>({
        queryKey: ['allGamesStrategic'],
        queryFn: () => getGames(undefined),
        enabled: isAdmin,
    });

    // Load local tracking data (for comparison metrics)
    const { data: localTrackingData } = useQuery<TrackingData, Error>({
        queryKey: ['localTrackingData'],
        queryFn: getTrackingData,
        initialData: getTrackingData(),
    });

    const filteredGames = useMemo(() => {
        if (!allGames) return [];
        if (selectedCategory === 'All') return allGames;
        return allGames.filter(game => game.category === selectedCategory);
    }, [allGames, selectedCategory]);

    if (isSessionLoading || isGamesLoading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 gaming-background">
                <Card className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
                    <p className="text-muted-foreground mt-2">Você não tem permissão de administrador para acessar esta página.</p>
                    <Button onClick={() => navigate('/')} className="mt-4">
                        <Home className="h-4 w-4 mr-2" /> Voltar ao Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    const handleSelectGame = (gameId: string) => {
        // Se o jogo 1 for selecionado, limpa o jogo 2 (que pode ser um jogo similar ou estimado)
        if (game1Id === gameId) {
            setGame1Id(null);
            setGame2Selection(null);
        } else if (game2Selection && 'id' in game2Selection && game2Selection.id === gameId) {
            // Se for o jogo 2 (do Supabase)
            setGame2Selection(null);
        } else if (!game1Id) {
            setGame1Id(gameId);
            setGame2Selection(null); // Limpa o jogo 2 ao selecionar o jogo 1
        } else {
            // Se o jogo 1 já estiver selecionado, define o jogo 2
            const selectedSupabaseGame = allGames?.find(g => g.id === gameId);
            if (selectedSupabaseGame) {
                setGame2Selection(selectedSupabaseGame);
            }
        }
    };
    
    const handleSelectSimilarGame = (game: GameOption) => {
        // Define o jogo 2 como o resultado da busca (GameOption)
        setGame2Selection({
            id: `similar-${Date.now()}`, // Cria um ID temporário para GameOption
            name: game.name,
            launch_date: game.launchDate,
            suggested_price: game.suggestedPrice,
            capsule_image_url: game.capsuleImageUrl,
            category: null,
            created_at: new Date().toISOString(),
            studio_id: null,
            priceUSD: game.priceUSD,
            reviewCount: game.reviewCount,
            reviewSummary: game.reviewSummary,
            developer: game.developer,
            publisher: game.publisher,
        } as SupabaseGame); // Força o tipo para SupabaseGame para compatibilidade com GameComparisonPanel
    };

    const handleSelectEstimatedGame = (game: EstimatedGame) => {
        // Define o jogo 2 como o resultado da estimativa (EstimatedGame)
        setGame2Selection(game);
        setIsEstimatorOpen(false);
    };

    const game1 = allGames?.find(g => g.id === game1Id);
    
    // O Game 2 é o objeto armazenado em game2Selection
    const game2 = game2Selection;

    return (
        <div className="min-h-screen p-4 md:p-8 font-sans gaming-background">
            <div className="space-y-8 max-w-7xl mx-auto bg-card p-6 rounded-lg shadow-xl border border-border">
                <DashboardHeader />
                
                <h1 className="text-3xl font-bold text-gogo-orange flex items-center">
                    <BarChart3 className="h-6 w-6 mr-3" /> Visualização Estratégica
                </h1>

                <AnimatedPanel delay={0}>
                    <Button onClick={() => navigate('/admin')} variant="outline" className="mb-4">
                        <ArrowRightLeft className="h-4 w-4 mr-2" /> Voltar ao Painel Admin
                    </Button>
                </AnimatedPanel>

                {/* --- Filtro de Categoria --- */}
                <AnimatedPanel delay={0.1}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center">
                                <Filter className="h-5 w-5 mr-2 text-gogo-cyan" /> Filtrar Jogos por Categoria
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col md:flex-row items-center gap-4">
                            <Select onValueChange={setSelectedCategory} defaultValue={selectedCategory}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <SelectValue placeholder="Todas as Categorias" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">Todas as Categorias ({allGames?.length || 0})</SelectItem>
                                    {MOCK_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat} ({allGames?.filter(g => g.category === cat).length || 0})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Selecione um jogo (Jogo 1) e, opcionalmente, um segundo jogo (Jogo 2) ou use as ferramentas abaixo.
                            </p>
                        </CardContent>
                    </Card>
                </AnimatedPanel>

                {/* --- Ferramentas de Comparação (Busca e Estimador) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnimatedPanel delay={0.2}>
                        <SimilarGamesSearch 
                            selectedGame={game1}
                            onSelectGameForComparison={handleSelectSimilarGame}
                        />
                    </AnimatedPanel>
                    
                    <AnimatedPanel delay={0.25}>
                        <Card className="shadow-md h-full flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center">
                                    <Calculator className="h-5 w-5 mr-2 text-gogo-cyan" /> Estimativa de Vendas (Fórmulas)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col justify-between">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Use Reviews e Preço para estimar vendas e receita líquida de um jogo similar usando métodos de mercado (Boxleiter, Carless, CCU).
                                </p>
                                <Dialog open={isEstimatorOpen} onOpenChange={setIsEstimatorOpen}>
                                    <DialogTrigger asChild>
                                        <Button 
                                            className="w-full bg-gogo-orange hover:bg-gogo-orange/90"
                                            disabled={!game1}
                                        >
                                            <Calculator className="h-4 w-4 mr-2" /> 
                                            {game1 ? `Estimar Jogo 2 (Baseado em ${game1.name})` : 'Selecione Jogo 1 Primeiro'}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[700px]">
                                        <GameEstimator 
                                            gameName={game1?.name || 'Jogo Estimado'}
                                            initialPrice={game1?.suggested_price || 30.00}
                                            initialCategory={game1?.category || 'Ação'}
                                            onEstimate={handleSelectEstimatedGame}
                                            onClose={() => setIsEstimatorOpen(false)}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    </AnimatedPanel>
                </div>
                
                {/* --- Nova Ferramenta de Análise de Vendas --- */}
                <AnimatedPanel delay={0.3}>
                    <GameSalesAnalyzer gameName={game1?.name || 'Selecione um Jogo'} />
                </AnimatedPanel>

                {/* --- Lista de Jogos Filtrados para Seleção --- */}
                <AnimatedPanel delay={0.4}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Jogos Disponíveis ({filteredGames.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            {filteredGames.map(game => {
                                const isSelected1 = game.id === game1Id;
                                const isSelected2 = game2Selection && 'id' in game2Selection && game2Selection.id === game.id;
                                
                                // Desabilita se Jogo 1 e Jogo 2 (Supabase) já estiverem selecionados
                                const isDisabled = !isSelected1 && !isSelected2 && game1Id && game2Selection && 'id' in game2Selection && !game2Selection.id.startsWith('similar-'); 

                                return (
                                    <Button
                                        key={game.id}
                                        variant={isSelected1 || isSelected2 ? 'default' : 'outline'}
                                        className={`
                                            ${isSelected1 ? 'bg-gogo-cyan hover:bg-gogo-cyan/90 text-white shadow-gogo-cyan-glow/50' : ''}
                                            ${isSelected2 ? 'bg-gogo-orange hover:bg-gogo-orange/90 text-white shadow-gogo-orange-glow/50' : ''}
                                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                        onClick={() => handleSelectGame(game.id)}
                                        disabled={isDisabled}
                                    >
                                        {game.name} {game.category && `(${game.category})`}
                                    </Button>
                                );
                            })}
                        </CardContent>
                    </Card>
                </AnimatedPanel>

                {/* --- Painel de Comparação --- */}
                <AnimatedPanel delay={0.5}>
                    <GameComparisonPanel 
                        game1={game1}
                        game2={game2}
                        localTrackingData={localTrackingData}
                    />
                </AnimatedPanel>
            </div>
            <MadeWithDyad />
        </div>
    );
};

export default StrategicView;