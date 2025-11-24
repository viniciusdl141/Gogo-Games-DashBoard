"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudios, Studio, assignGameToStudio, removeGameFromStudio } from '@/integrations/supabase/studios';
import { getGames, Game as SupabaseGame } from '@/integrations/supabase/games';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowRight, X } from 'lucide-react';

const GameAssignment: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedStudioId, setSelectedStudioId] = useState<string>('');

    const { data: studios, isLoading: isLoadingStudios } = useQuery<Studio[], Error>({
        queryKey: ['studios'],
        queryFn: getStudios,
    });

    // Fetch ALL games (Admin has RLS access to all)
    const { data: games, isLoading: isLoadingGames } = useQuery<SupabaseGame[], Error>({
        queryKey: ['supabaseGames'],
        queryFn: getGames,
    });

    const gamesWithoutStudio = useMemo(() => {
        return games?.filter(g => !g.studio_id) || [];
    }, [games]);

    const gamesByStudio = useMemo(() => {
        const map = new Map<string, SupabaseGame[]>();
        if (studios && games) {
            studios.forEach(studio => {
                map.set(studio.id, games.filter(g => g.studio_id === studio.id));
            });
        }
        return map;
    }, [studios, games]);

    const assignmentMutation = useMutation({
        mutationFn: ({ gameId, studioId }: { gameId: string, studioId: string | null }) => {
            if (studioId) {
                return assignGameToStudio(gameId, studioId);
            } else {
                return removeGameFromStudio(gameId);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['supabaseGames'] });
            toast.success("Atribuição de jogo atualizada.");
        },
        onError: (error) => {
            toast.error(`Falha na atribuição: ${error.message}`);
        },
    });

    const handleAssign = (gameId: string, studioId: string) => {
        assignmentMutation.mutate({ gameId, studioId });
    };

    const handleRemove = (gameId: string) => {
        assignmentMutation.mutate({ gameId, studioId: null });
    };

    if (isLoadingStudios || isLoadingGames) {
        return <Loader2 className="h-8 w-8 animate-spin text-gogo-cyan mx-auto mt-10" />;
    }
    
    const selectedStudio = studios?.find(s => s.id === selectedStudioId);
    const gamesInSelectedStudio = selectedStudioId ? gamesByStudio.get(selectedStudioId) || [] : [];

    return (
        <div className="space-y-8">
            
            {/* Games Without Studio */}
            <Card>
                <CardHeader>
                    <CardTitle>Jogos Sem Estúdio Atribuído ({gamesWithoutStudio.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {gamesWithoutStudio.length === 0 ? (
                        <p className="text-muted-foreground">Todos os jogos estão atribuídos a um estúdio.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Jogo</TableHead>
                                    <TableHead className="w-[250px]">Atribuir a Estúdio</TableHead>
                                    <TableHead className="w-[100px] text-center">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gamesWithoutStudio.map(game => (
                                    <TableRow key={game.id}>
                                        <TableCell className="font-medium">{game.name}</TableCell>
                                        <TableCell>
                                            <Select onValueChange={(studioId) => handleAssign(game.id, studioId)}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione o Estúdio" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {studios?.map(studio => (
                                                        <SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                disabled={assignmentMutation.isPending}
                                                className="text-gogo-cyan hover:bg-gogo-cyan/10"
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Games By Studio */}
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Atribuições de Estúdios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select onValueChange={setSelectedStudioId} value={selectedStudioId}>
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue placeholder="Selecione um Estúdio para Gerenciar" />
                        </SelectTrigger>
                        <SelectContent>
                            {studios?.map(studio => (
                                <SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedStudio && (
                        <div className="mt-4">
                            <h4 className="text-lg font-semibold mb-2">Jogos Atribuídos a {selectedStudio.name} ({gamesInSelectedStudio.length})</h4>
                            {gamesInSelectedStudio.length === 0 ? (
                                <p className="text-muted-foreground">Nenhum jogo atribuído a este estúdio.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Jogo</TableHead>
                                            <TableHead className="w-[250px]">Transferir para</TableHead>
                                            <TableHead className="w-[100px] text-center">Remover</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {gamesInSelectedStudio.map(game => (
                                            <TableRow key={game.id}>
                                                <TableCell className="font-medium">{game.name}</TableCell>
                                                <TableCell>
                                                    <Select onValueChange={(newStudioId) => handleAssign(game.id, newStudioId)}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Transferir Jogo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {studios?.filter(s => s.id !== selectedStudioId).map(studio => (
                                                                <SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleRemove(game.id)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default GameAssignment;