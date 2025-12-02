"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Bot, TrendingUp, DollarSign, List, Info, Trash2, BookOpen } from 'lucide-react'; 
import { useQuery } from '@tanstack/react-query';
import { getGames, GameOption, mergeGameData } from '@/integrations/supabase/games';
import { useSession } from '@/components/SessionContextProvider';
import { getTrackingData, TrackingData } from '@/data/trackingData';
import { toast } from 'sonner';

import GameEstimator, { EstimatedGame } from '@/components/strategic/GameEstimator'; 
import GameComparisonPanel, { ComparisonGame } from '@/components/strategic/GameComparisonPanel';
import GameSalesAnalyzer from '@/components/strategic/GameSalesAnalyzer';
import SalesAnalyzerPanel from '@/components/strategic/SalesAnalyzerPanel'; 
import EstimationMethodReferences from '@/components/strategic/EstimationMethodReferences'; // NOVO IMPORT
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KpiCard from '@/components/dashboard/KpiCard'; 

// Inicializa dados locais (simulando o estado global de tracking)
const initialLocalTrackingData = getTrackingData();

// Tipagem para o estado de seleção de jogos
type Game1Selection = GameOption | null;
type Game2Selection = GameOption | EstimatedGame | null;

const StrategicView = () => {
    const { isAdmin, studioId, isLoading: isSessionLoading } = useSession();
    const [localTrackingData, setLocalTrackingData] = useState<TrackingData>(initialLocalTrackingData); 
    const [game1, setGame1] = useState<Game1Selection>(null);
    const [game2, setGame2] = useState<Game2Selection>(null);
    const [estimatedGame, setEstimatedGame] = useState<EstimatedGame | null>(null);
    const [selectedTab, setSelectedTab] = useState('comparison');

    // Fetch games from Supabase
    const { data: supabaseGames, isLoading: isGamesLoading } = useQuery<GameOption[], Error>({
        queryKey: ['supabaseGamesStrategic', studioId, isAdmin],
        queryFn: () => getGames(isAdmin ? undefined : studioId),
        initialData: [],
        enabled: !isSessionLoading,
    });

    // Combina jogos do Supabase com jogos locais (apenas nomes)
    const allAvailableGames = useMemo(() => {
        const combinedMap = new Map<string, GameOption>();
        
        // 1. Adiciona jogos do Supabase (fonte primária de metadados)
        supabaseGames.forEach(game => {
            combinedMap.set(game.name.trim(), game);
        });

        // 2. Adiciona jogos do tracking local se não estiverem no Supabase (apenas nome)
        localTrackingData.games.forEach(gameName => {
            const normalizedGameName = gameName.trim();
            if (!combinedMap.has(normalizedGameName)) {
                combinedMap.set(normalizedGameName, { 
                    id: `local-${normalizedGameName}`, 
                    name: normalizedGameName, 
                    launch_date: null, 
                    suggested_price: null, 
                    capsule_image_url: null,
                    category: null,
                });
            }
        });

        return Array.from(combinedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [supabaseGames, localTrackingData.games]);

    // Função para selecionar um jogo real (GameOption)
    const handleSelectGame = useCallback((gameName: string, setter: React.Dispatch<React.SetStateAction<Game1Selection | Game2Selection>>) => {
        const selected = allAvailableGames.find(g => g.name === gameName);
        if (selected) {
            setter(selected);
            // Se o jogo 2 for selecionado, remove a estimativa
            if (setter === setGame2) {
                setEstimatedGame(null);
            }
        }
    }, [allAvailableGames]);

    // Função para aplicar a estimativa ao Game 2
    const handleApplyEstimation = useCallback((estimation: EstimatedGame) => {
        setEstimatedGame(estimation);
        setGame2(estimation);
        toast.success(`Estimativa para ${estimation.name} aplicada ao Jogo 2.`);
    }, []);

    // Função para limpar a estimativa
    const handleClearEstimation = useCallback(() => {
        setEstimatedGame(null);
        if (game2 && 'estimatedSales' in game2) {
            setGame2(null);
        }
        toast.info("Estimativa removida.");
    }, [game2]);

    if (isSessionLoading || isGamesLoading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando Visão Estratégica...</div>;
    }

    return (
        <div className="min-h-screen p-6 bg-background text-foreground">
            <h1 className="text-3xl font-bold mb-6 text-gogo-cyan">Visão Estratégica e Comparação</h1>

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                <TabsList className="flex w-full overflow-x-auto whitespace-nowrap border-b border-border text-muted-foreground rounded-t-lg p-0 h-auto shadow-md bg-card">
                    <TabsTrigger value="comparison" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white transition-all duration-200 hover:bg-gogo-cyan/10">Comparação de Jogos</TabsTrigger>
                    <TabsTrigger value="estimator" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white transition-all duration-200 hover:bg-gogo-cyan/10">Estimador de Vendas</TabsTrigger>
                    <TabsTrigger value="analyzer" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white transition-all duration-200 hover:bg-gogo-cyan/10">Análise Temporal</TabsTrigger>
                    <TabsTrigger value="ai-analysis" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white transition-all duration-200 hover:bg-gogo-cyan/10">Análise de Vendas (IA)</TabsTrigger>
                    <TabsTrigger value="references" className="min-w-fit px-4 py-2 data-[state=active]:bg-gogo-cyan data-[state=active]:text-white transition-all duration-200 hover:bg-gogo-cyan/10"><BookOpen className="h-4 w-4 mr-2" /> Referências</TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="space-y-6 mt-4">
                    <Card className="p-4 shadow-lg">
                        <CardHeader> 
                            <CardTitle className="text-xl">Configuração da Comparação</CardTitle> 
                        </CardHeader> 
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="game1-select">Jogo 1 (Base de Dados)</Label>
                                <Select onValueChange={(name) => handleSelectGame(name, setGame1)} value={game1?.name || ''}>
                                    <SelectTrigger id="game1-select">
                                        <SelectValue placeholder="Selecione o Jogo 1" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allAvailableGames.map(game => (
                                            <SelectItem key={game.id} value={game.name}>{game.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="game2-select">Jogo 2 (Comparação)</Label>
                                <Select onValueChange={(name) => handleSelectGame(name, setGame2)} value={game2 && !('estimatedSales' in game2) ? game2.name : ''}>
                                    <SelectTrigger id="game2-select">
                                        <SelectValue placeholder="Selecione o Jogo 2" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allAvailableGames.map(game => (
                                            <SelectItem key={game.id} value={game.name}>{game.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                {estimatedGame ? (
                                    <Button onClick={handleClearEstimation} variant="destructive" className="w-full">
                                        <Trash2 className="h-4 w-4 mr-2" /> Remover Estimativa ({estimatedGame.name}) 
                                    </Button>
                                ) : (
                                    <Button onClick={() => setSelectedTab('estimator')} variant="outline" className="w-full text-gogo-orange border-gogo-orange hover:bg-gogo-orange/10">
                                        <Bot className="h-4 w-4 mr-2" /> Usar Estimador no Jogo 2
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <GameComparisonPanel 
                        game1={game1}
                        game2={game2} 
                        localTrackingData={localTrackingData}
                    />
                </TabsContent>

                <TabsContent value="estimator" className="space-y-6 mt-4">
                    <GameEstimator 
                        allGames={allAvailableGames}
                        onApplyEstimation={handleApplyEstimation}
                        localTrackingData={localTrackingData}
                    />
                </TabsContent>

                <TabsContent value="analyzer" className="space-y-6 mt-4">
                    <Card className="p-4 shadow-lg mb-6">
                        <CardHeader> 
                            <CardTitle className="text-xl">Selecione o Jogo para Análise Temporal</CardTitle> 
                        </CardHeader> 
                        <CardContent>
                            <div className="space-y-2 w-full md:w-1/3">
                                <Label htmlFor="analyzer-select">Jogo para Análise</Label>
                                <Select onValueChange={(name) => handleSelectGame(name, setGame1)} value={game1?.name || ''}>
                                    <SelectTrigger id="analyzer-select">
                                        <SelectValue placeholder="Selecione o Jogo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allAvailableGames.map(game => (
                                            <SelectItem key={game.id} value={game.name}>{game.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {game1 && (
                        <GameSalesAnalyzer 
                            game={game1}
                            wlSalesData={localTrackingData.wlSales}
                        />
                    )}
                </TabsContent>
                
                <TabsContent value="ai-analysis" className="space-y-6 mt-4">
                    <SalesAnalyzerPanel 
                        allGames={allAvailableGames}
                    />
                </TabsContent>
                
                <TabsContent value="references" className="space-y-6 mt-4">
                    <EstimationMethodReferences />
                </TabsContent>
            </Tabs>

            <MadeWithDyad />
        </div>
    );
};

export default StrategicView;