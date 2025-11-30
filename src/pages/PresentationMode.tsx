"use client";

import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getGames, Game as SupabaseGame } from '@/integrations/supabase/games';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, ArrowRight, Loader2, Presentation } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { toast } from 'sonner';
import { TrackingData, getTrackingData } from '@/data/trackingData';
import PresentationSlide from '@/components/presentation/PresentationSlide';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useGameMetrics } from '@/hooks/useGameMetrics'; // NEW IMPORT
import { TimeFrame } from '@/components/dashboard/WlConversionKpisPanel'; // Import TimeFrame

const PresentationMode: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { isAdmin, studioId, isLoading: isSessionLoading } = useSession();

    // 1. Fetch Games (to get game metadata)
    const { data: supabaseGames, isLoading: isGamesLoading } = useQuery<SupabaseGame[], Error>({
        queryKey: ['supabaseGamesPresentation'],
        queryFn: () => getGames(isAdmin ? undefined : studioId),
        initialData: [],
        enabled: !isSessionLoading,
    });

    // 2. Load Local Tracking Data (for metrics)
    const { data: localTrackingData, isLoading: isTrackingLoading } = useQuery<TrackingData, Error>({
        queryKey: ['localTrackingDataPresentation'],
        queryFn: getTrackingData,
        initialData: getTrackingData(),
    });

    const selectedGame = useMemo(() => {
        return supabaseGames.find(game => game.id === gameId);
    }, [supabaseGames, gameId]);

    const gameName = selectedGame?.name || 'Jogo Desconhecido';

    // 3. Use the centralized metrics hook (using 'All' platform and 'total' timeframe for presentation)
    const filteredData = useGameMetrics({
        selectedGameName: gameName,
        selectedGame: selectedGame,
        trackingData: localTrackingData,
        selectedPlatform: 'All',
        selectedTimeFrame: 'total' as TimeFrame,
    });

    if (isSessionLoading || isGamesLoading || isTrackingLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gogo-cyan" /> Carregando dados...</div>;
    }

    if (!selectedGame || !filteredData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 gaming-background">
                <Card className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-destructive">Jogo Não Encontrado</h1>
                    <p className="text-muted-foreground mt-2">O jogo com ID {gameId} não foi encontrado ou você não tem acesso.</p>
                    <Button onClick={() => navigate('/')} className="mt-4">
                        <Home className="h-4 w-4 mr-2" /> Voltar ao Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    // Define the slides content
    const slides = [
        { id: 'intro', title: 'Visão Geral do Jogo', component: 'Intro' },
        { id: 'wl-sales', title: 'Evolução WL & Vendas', component: 'WLSales' },
        { id: 'marketing-summary', title: 'Resumo de Marketing', component: 'MarketingSummary' },
        { id: 'influencers', title: 'Performance de Influencers', component: 'Influencers' },
        { id: 'paid-traffic', title: 'Performance de Tráfego Pago', component: 'PaidTraffic' },
        { id: 'demo-reviews', title: 'Demo & Reviews', component: 'DemoReviews' },
    ];

    return (
        <div className="min-h-screen w-full flex flex-col gaming-background">
            <header className="p-4 bg-card border-b border-border flex justify-between items-center shadow-md">
                <div className="flex items-center space-x-4">
                    <Button onClick={() => navigate('/')} variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Dashboard
                    </Button>
                    <h1 className="text-xl font-bold text-gogo-orange flex items-center">
                        <Presentation className="h-5 w-5 mr-2 text-gogo-cyan" /> Modo Apresentação: {gameName}
                    </h1>
                </div>
            </header>

            <main className="flex-grow p-4 md:p-8 flex items-center justify-center">
                <Carousel className="w-full max-w-6xl h-[80vh]">
                    <CarouselContent className="h-full">
                        {slides.map((slide, index) => (
                            <CarouselItem key={slide.id} className="h-full">
                                <PresentationSlide 
                                    slideId={slide.id}
                                    slideTitle={slide.title}
                                    gameData={filteredData} // Pass the centralized metrics
                                    allGames={supabaseGames}
                                    trackingData={localTrackingData}
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gogo-cyan hover:bg-gogo-cyan/90 text-white" />
                    <CarouselNext className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gogo-cyan hover:bg-gogo-cyan/90 text-white" />
                </Carousel>
            </main>
            <MadeWithDyad />
        </div>
    );
};

export default PresentationMode;