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
import { Home, BarChart3, Filter, ArrowRightLeft, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GameComparisonPanel from '@/components/strategic/GameComparisonPanel';
import SimilarGamesSearch from '@/components/strategic/SimilarGamesSearch'; // Importar novo componente
import { TrackingData, getTrackingData } from '@/data/trackingData';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { GameOption } from '@/integrations/supabase/functions'; // Importar GameOption

// Mock data for categories (should eventually come from DB or configuration)
const MOCK_CATEGORIES = ['Ação', 'Terror', 'RPG', 'Estratégia', 'Simulação', 'Aventura', 'Outro'];

const StrategicView: React.FC = () => {
    const { isAdmin, isLoading: isSessionLoading } = useSession();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [game1Id, setGame1Id] = useState<string | null>(null);
    // game2Id agora pode ser um ID do Supabase ou um objeto GameOption temporário
    const [game2Selection, setGame2Selection] = useState<SupabaseGame | GameOption | null>(null);
    
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
        // Se o jogo 1 for selecionado, limpa o jogo 2 (que pode ser um jogo similar)
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
            category: null, // Categoria não é relevante para o GameOption
            created_at: new Date().toISOString(),
            studio_id: null,
            // Adiciona campos extras do GameOption para que GameComparisonPanel possa usá-los
            priceUSD: game.priceUSD,
            reviewCount: game.reviewCount,
            reviewSummary: game.reviewSummary,
            developer: game.developer,
            publisher: game.publisher,
        } as SupabaseGame); // Força o tipo para SupabaseGame para compatibilidade com GameComparisonPanel
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
                                Selecione um jogo (Jogo 1) e, opcionalmente, um segundo jogo (Jogo 2) ou use a busca de similares.
                            </p>
                        </CardContent>
                    </Card>
                </AnimatedPanel>

                {/* --- Busca de Similares --- */}
                <AnimatedPanel delay={0.2}>
                    <SimilarGamesSearch 
                        selectedGame={game1}
                        onSelectGameForComparison={handleSelectSimilarGame}
                    />
                </AnimatedPanel>

                {/* --- Lista de Jogos Filtrados para Seleção --- */}
                <AnimatedPanel delay={0.3}>
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
                                const isDisabled = !isSelected1 && !isSelected2 && game1Id && game2Selection; // Desabilita se Jogo 1 e Jogo 2 (Supabase ou Similar) já estiverem selecionados

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
                <AnimatedPanel delay={0.4}>
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