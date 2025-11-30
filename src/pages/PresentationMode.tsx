import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchGamesByStudio } from '@/integrations/supabase/games';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, RefreshCw, Settings, Presentation, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { RawTrackingData } from '@/data/trackingData';
import { fetchTrackingData } from '@/integrations/supabase/tracking';
import PresentationSlide from '@/components/presentation/PresentationSlide';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useGameMetrics } from '@/hooks/useGameMetrics'; // NEW IMPORT

// Placeholder for TimeFrame if needed, otherwise remove the import
// import { TimeFrame } from '@/components/dashboard/WlConversionKpisPanel'; 

const SLIDE_TYPES = ['summary', 'wl_kpis', 'influencers', 'events', 'paid_traffic', 'demo_reviews'] as const;
type SlideType = typeof SLIDE_TYPES[number];

const PresentationMode: React.FC = () => {
    const navigate = useNavigate();
    const { isAdmin, studioId, isLoading: isSessionLoading } = useSession();
    const { gameId: urlGameId } = useParams<{ gameId: string }>();

    const [selectedGameId, setSelectedGameId] = useState<string | null>(urlGameId || null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    // Fetch games
    const { data: games = [], isLoading: isLoadingGames } = useQuery({
        queryKey: ['studioGames', studioId],
        queryFn: () => fetchGamesByStudio(studioId!),
        enabled: !!studioId,
    });

    // Fetch tracking data
    const { data: rawData = {} as RawTrackingData, isLoading: isLoadingTracking } = useQuery({
        queryKey: ['trackingData', studioId],
        queryFn: () => fetchTrackingData(studioId!),
        enabled: !!studioId,
        initialData: {} as RawTrackingData,
    });

    useEffect(() => {
        if (urlGameId && games.length > 0 && !games.some(g => g.id === urlGameId)) {
            // If URL gameId is invalid, reset selection
            setSelectedGameId(null);
        } else if (!selectedGameId && games.length > 0) {
            setSelectedGameId(games[0].id);
        }
    }, [games, urlGameId, selectedGameId]);

    const selectedGame = useMemo(() => games.find(g => g.id === selectedGameId) || null, [games, selectedGameId]);
    const selectedGameName = selectedGame?.name.trim() || '';

    const isLoading = isSessionLoading || isLoadingGames || isLoadingTracking;

    const handleNextSlide = () => {
        setCurrentSlideIndex(prev => (prev + 1) % SLIDE_TYPES.length);
    };

    const handlePrevSlide = () => {
        setCurrentSlideIndex(prev => (prev - 1 + SLIDE_TYPES.length) % SLIDE_TYPES.length);
    };

    const currentSlideType = SLIDE_TYPES[currentSlideIndex];

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
                <RefreshCw className="h-8 w-8 animate-spin text-gogo-cyan mx-auto" />
                <p className="mt-4 text-lg">Preparando apresentação...</p>
            </div>
        );
    }

    if (!studioId || games.length === 0 || !selectedGame) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <Card className="p-6 mt-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gogo-orange mb-4">Dados Insuficientes</h2>
                    <p className="text-gray-600 mb-6">
                        Selecione um jogo no Dashboard para iniciar o modo de apresentação.
                    </p>
                    <Button onClick={() => navigate('/dashboard')} className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                        <BarChart3 className="h-4 w-4 mr-2" /> Ir para Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Header/Controls */}
            <header className="p-4 bg-gray-800 shadow-md flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-gogo-cyan flex items-center">
                        <Presentation className="h-6 w-6 mr-2" /> Modo Apresentação
                    </h1>
                    <Select
                        value={selectedGameId || ''}
                        onValueChange={(id) => {
                            setSelectedGameId(id);
                            navigate(`/presentation/${id}`);
                        }}
                    >
                        <SelectTrigger className="w-[200px] bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Mudar Jogo" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 text-white">
                            {games.map(game => (
                                <SelectItem key={game.id} value={game.id}>
                                    {game.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={handlePrevSlide} disabled={currentSlideIndex === 0}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm font-medium">
                        {currentSlideIndex + 1} / {SLIDE_TYPES.length}
                    </span>
                    <Button variant="ghost" onClick={handleNextSlide} disabled={currentSlideIndex === SLIDE_TYPES.length - 1}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/dashboard')} className="text-gray-300 border-gray-600 hover:bg-gray-700">
                        Sair
                    </Button>
                </div>
            </header>

            {/* Slide Content */}
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-6xl h-[80vh] bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden">
                    <PresentationSlide
                        trackingData={rawData}
                        gameName={selectedGameName}
                        slideType={currentSlideType}
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="p-2 bg-gray-800 text-center text-xs text-gray-500">
                <MadeWithDyad />
            </footer>
        </div>
    );
};

export default PresentationMode;