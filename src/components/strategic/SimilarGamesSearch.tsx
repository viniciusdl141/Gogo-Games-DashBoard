"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Gamepad2, DollarSign, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Game as SupabaseGame } from '@/integrations/supabase/schema'; // Corrigido o import
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface SimilarGamesSearchProps {
    allGames: SupabaseGame[];
    onSelectGame: (game: SupabaseGame) => void;
}

const SimilarGamesSearch: React.FC<SimilarGamesSearchProps> = ({ allGames, onSelectGame }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const filteredGames = useMemo(() => {
        if (!searchTerm) return [];
        const lowerCaseSearch = searchTerm.toLowerCase();
        return allGames.filter(game => 
            game.name.toLowerCase().includes(lowerCaseSearch) ||
            game.category?.toLowerCase().includes(lowerCaseSearch)
        ).slice(0, 5); // Limita a 5 resultados
    }, [searchTerm, allGames]);

    const handleSearch = async () => {
        if (!searchTerm) return;
        setIsSearching(true);
        // Simulação de busca em API externa
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSearching(false);
        
        if (filteredGames.length === 0) {
            toast.info(`Nenhum jogo encontrado para "${searchTerm}".`);
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl flex items-center text-gogo-cyan">
                    <Search className="h-5 w-5 mr-2" /> Buscar Jogos Similares
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex space-x-2">
                    <Input
                        placeholder="Nome do jogo ou categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        disabled={isSearching}
                    />
                    <Button onClick={handleSearch} disabled={isSearching || !searchTerm}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                </div>

                {filteredGames.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Resultados ({filteredGames.length}):</p>
                        {filteredGames.map(game => (
                            <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    {game.capsule_image_url && (
                                        <img src={game.capsule_image_url} alt={game.name} className="w-8 h-8 object-cover rounded-sm" />
                                    )}
                                    <div>
                                        <p className="font-semibold">{game.name}</p>
                                        <Badge variant="secondary" className="text-xs">{game.category || 'N/A'}</Badge>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <DollarSign className="h-3 w-3 mr-1" /> {formatCurrency(game.suggested_price || 0)}
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" /> {game.launch_date ? formatDate(new Date(game.launch_date)) : 'N/A'}
                                    </div>
                                    <Button size="sm" onClick={() => onSelectGame(game)} className="bg-gogo-orange hover:bg-gogo-orange/90">
                                        Selecionar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SimilarGamesSearch;