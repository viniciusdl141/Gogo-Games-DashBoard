"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Gamepad, Calendar, DollarSign, MessageSquare, Building2, ArrowRight } from 'lucide-react';
import { invokeGameDataFetcher, GameOption } from '@/integrations/supabase/functions';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Game as SupabaseGame } from '@/integrations/supabase/games';
import { Separator } from '@/components/ui/separator';

interface SimilarGamesSearchProps {
    selectedGame: SupabaseGame | undefined;
    onSelectGameForComparison: (game: GameOption) => void;
}

// Hardcoded API Key (as provided by the user)
const GEMINI_API_KEY = 'AIzaSyCao7UHpJgeYGExguqjvecUwdeztYhnxWU';

const SimilarGamesSearch: React.FC<SimilarGamesSearchProps> = ({ selectedGame, onSelectGameForComparison }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<GameOption[]>([]);
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    const handleSearch = async () => {
        if (!selectedGame) {
            toast.error("Selecione um jogo para buscar similares.");
            return;
        }

        setIsLoading(true);
        setResults([]);
        setIsSearchVisible(true);
        
        const searchName = selectedGame.name;
        toast.loading(`Buscando jogos similares a "${searchName}" na web...`, { id: 'similar-search' });

        try {
            // We ask Gemini to search for similar games based on the selected game's name and category
            const query = `Jogos similares a "${searchName}" (Categoria: ${selectedGame.category || 'Geral'})`;
            
            const response = await invokeGameDataFetcher(query, GEMINI_API_KEY);
            
            toast.dismiss('similar-search');

            if (response.results && response.results.length > 0) {
                // Filter out the selected game itself if it appears in results
                const filteredResults = response.results.filter(r => r.name.trim().toLowerCase() !== searchName.trim().toLowerCase());
                setResults(filteredResults);
                toast.success(`${filteredResults.length} jogos similares encontrados.`);
            } else {
                toast.error(`A busca não encontrou jogos similares para "${searchName}".`);
            }

        } catch (error) {
            console.error("Web Search Error:", error);
            toast.dismiss('similar-search');
            toast.error(`Falha na busca: ${error.message}.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (game: GameOption) => {
        onSelectGameForComparison(game);
        // Optionally hide search results after selection
        setIsSearchVisible(false);
    };

    return (
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xl flex items-center">
                    <Gamepad className="h-5 w-5 mr-2 text-gogo-orange" /> Busca de Similares (Gemini)
                </CardTitle>
                <Button 
                    onClick={() => isSearchVisible ? setIsSearchVisible(false) : handleSearch()} 
                    disabled={!selectedGame || isLoading}
                    variant={isSearchVisible ? 'destructive' : 'default'}
                    className={isSearchVisible ? 'bg-destructive hover:bg-destructive/90' : 'bg-gogo-cyan hover:bg-gogo-cyan/90'}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Search className="h-4 w-4 mr-2" />
                    )}
                    {isSearchVisible ? 'Ocultar Busca' : `Buscar Similares a ${selectedGame?.name || 'Jogo'}`}
                </Button>
            </CardHeader>
            
            {isSearchVisible && (
                <CardContent className="pt-4 space-y-4">
                    <Separator />
                    {isLoading && <p className="text-center text-muted-foreground">Aguarde, buscando dados...</p>}
                    
                    {!isLoading && results.length === 0 && selectedGame && (
                        <p className="text-center text-muted-foreground">Nenhum resultado encontrado. Tente novamente.</p>
                    )}

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {results.map((game, index) => (
                            <Card key={index} className="p-3 hover:bg-muted/50 transition-colors border-l-4 border-gogo-orange">
                                <CardContent className="p-0 flex justify-between items-start">
                                    <div className="flex space-x-3">
                                        <div className="space-y-1 flex-1">
                                            <p className="font-bold text-sm">{game.name}</p>
                                            
                                            {/* Metadados */}
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {game.reviewSummary && (
                                                    <Badge variant="default" className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                                                        <MessageSquare className="h-3 w-3 mr-1" /> {game.reviewSummary} ({formatNumber(game.reviewCount || 0)})
                                                    </Badge>
                                                )}
                                                <Badge variant="secondary" className="flex items-center">
                                                    <DollarSign className="h-3 w-3 mr-1" /> USD: {formatCurrency(game.priceUSD || 0).replace('R$', 'USD')}
                                                </Badge>
                                            </div>

                                            {/* Data e Desenvolvedora */}
                                            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground pt-1">
                                                <span className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" /> 
                                                    Lançamento: {game.launchDate ? formatDate(new Date(game.launchDate)) : 'N/A'}
                                                </span>
                                                {game.developer && (
                                                    <span className="flex items-center">
                                                        <Building2 className="h-3 w-3 mr-1" /> 
                                                        Dev: {game.developer}
                                                    </span>
                                                )}
                                                <span className="text-xs italic">({game.source})</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        onClick={() => handleSelect(game)}
                                        className="bg-gogo-cyan hover:bg-gogo-cyan/90 flex-shrink-0 ml-4"
                                    >
                                        <ArrowRight className="h-4 w-4 mr-1" /> Comparar
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default SimilarGamesSearch;