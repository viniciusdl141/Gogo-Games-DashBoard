"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGames } from '@/integrations/supabase/games';
import { Game as SupabaseGame } from '@/integrations/supabase/schema'; 
import { useSession } from '@/components/SessionContextProvider';
import { getTrackingData, TrackingData } from '@/data/trackingData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Presentation, Loader2 } from 'lucide-react';
import PresentationSlide from '@/components/presentation/PresentationSlide';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MadeWithDyad } from '@/components/made-with-dyad'; // Importando MadeWithDyad

// Tipos de slides
type SlideType = 'summary' | 'wl-sales' | 'marketing' | 'demo-reviews';
const SLIDE_ORDER: SlideType[] = ['summary', 'wl-sales', 'marketing', 'demo-reviews'];

const PresentationMode: React.FC = () => {
    const { isAdmin, studioId, isLoading: isSessionLoading } = useSession();
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    
    // Inicializa dados locais (simulando o estado global de tracking)
    const localTrackingData = useMemo<TrackingData>(() => getTrackingData(), []);

    // Fetch games from Supabase
    const { data: supabaseGames, isLoading: isGamesLoading } = useQuery<SupabaseGame[], Error>({
        queryKey: ['supabaseGamesPresentation', studioId, isAdmin],
        queryFn: () => getGames(isAdmin ? undefined : studioId),
        initialData: [],
        enabled: !isSessionLoading,
    });

    // Seleciona o primeiro jogo como padrão
    React.useEffect(() => {
        if (supabaseGames.length > 0 && !selectedGameId) {
            setSelectedGameId(supabaseGames[0].id);
        }
    }, [supabaseGames, selectedGameId]);

    const selectedGame = useMemo(() => {
        return supabaseGames.find(g => g.id === selectedGameId) || null;
    }, [supabaseGames, selectedGameId]);

    const currentSlideType = SLIDE_ORDER[currentSlideIndex];

    const handleNext = () => {
        setCurrentSlideIndex((prev) => Math.min(SLIDE_ORDER.length - 1, prev + 1));
    };

    const handlePrev = () => {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
    };

    if (isSessionLoading || isGamesLoading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando Modo de Apresentação...</div>;
    }

    if (!selectedGame) {
        return (
            <div className="min-h-screen flex flex-col p-8 bg-background text-foreground">
                <h1 className="text-3xl font-bold mb-6 text-gogo-cyan flex items-center"><Presentation className="h-7 w-7 mr-2" /> Modo de Apresentação</h1>
                <Card className="flex-grow flex items-center justify-center p-10">
                    <p className="text-muted-foreground">Nenhum jogo disponível para apresentação.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header de Controle */}
            <div className="p-4 bg-white dark:bg-gray-800 shadow-md flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-gogo-cyan">{selectedGame.name}</h1>
                    <Select onValueChange={setSelectedGameId} value={selectedGameId || ''}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Mudar Jogo" />
                        </SelectTrigger>
                        <SelectContent>
                            {supabaseGames.map(game => (
                                <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                        Slide {currentSlideIndex + 1} de {SLIDE_ORDER.length}: {currentSlideType.toUpperCase().replace('-', ' ')}
                    </span>
                    <Button onClick={handlePrev} disabled={currentSlideIndex === 0} variant="outline">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleNext} disabled={currentSlideIndex === SLIDE_ORDER.length - 1} variant="outline">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Conteúdo do Slide */}
            <div className={cn(
                "flex-grow p-8 transition-all duration-500",
                currentSlideType === 'wl-sales' ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900'
            )}>
                <PresentationSlide 
                    game={selectedGame}
                    trackingData={localTrackingData}
                    slideType={currentSlideType}
                />
            </div>

            <MadeWithDyad />
        </div>
    );
};

export default PresentationMode;