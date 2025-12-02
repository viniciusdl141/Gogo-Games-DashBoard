"use client";

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudios, addStudio, updateStudio, deleteStudio } from '@/integrations/supabase/studios';
import { getGames, deleteGame as deleteGameFromSupabase } from '@/integrations/supabase/games';
import { Game as SupabaseGame, Studio as StudioSchema } from '@/integrations/supabase/schema'; // Importando Studio do schema
import StudioForm from '@/components/admin/StudioForm';
import EditStudioForm from '@/components/admin/EditStudioForm'; // Corrigido o erro 2
import DeleteGameButton from '@/components/dashboard/DeleteGameButton'; // Importando DeleteGameButton
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Users, Gamepad2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { useSession } from '@/components/SessionContextProvider';

const AdminPanel: React.FC = () => {
    const { isAdmin, isLoading: isSessionLoading } = useSession();
    const [isStudioFormOpen, setIsStudioFormOpen] = useState(false);
    const [editingStudio, setEditingStudio] = useState<StudioSchema | null>(null);

    // Fetch Studios
    const { data: studios, refetch: refetchStudios, isLoading: isStudiosLoading } = useQuery<StudioSchema[], Error>({
        queryKey: ['studios'],
        queryFn: getStudios,
        initialData: [],
        enabled: isAdmin && !isSessionLoading,
    });

    // Fetch Games (All games for admin view)
    const { data: games, refetch: refetchGames, isLoading: isGamesLoading } = useQuery<SupabaseGame[], Error>({
        queryKey: ['allGamesAdmin'],
        queryFn: () => getGames(undefined), // Fetch all games
        initialData: [],
        enabled: isAdmin && !isSessionLoading,
    });

    const handleAddStudio = useCallback(async (name: string) => {
        try {
            await addStudio(name);
            refetchStudios();
            toast.success(`Estúdio "${name}" adicionado com sucesso.`);
            setIsStudioFormOpen(false);
        } catch (error) {
            console.error("Error adding studio:", error);
            toast.error("Falha ao adicionar estúdio.");
        }
    }, [refetchStudios]);

    const handleUpdateStudio = useCallback(async (id: string, name: string) => {
        try {
            // Corrigido o erro 3: updateStudio espera um objeto Partial<Studio>
            await updateStudio(id, { name }); 
            refetchStudios();
            toast.success(`Estúdio "${name}" atualizado com sucesso.`);
            setEditingStudio(null);
        } catch (error) {
            console.error("Error updating studio:", error);
            toast.error("Falha ao atualizar estúdio.");
        }
    }, [refetchStudios]);

    const handleDeleteStudio = useCallback(async (id: string) => {
        try {
            await deleteStudio(id);
            refetchStudios();
            toast.success("Estúdio excluído com sucesso.");
        } catch (error) {
            console.error("Error deleting studio:", error);
            toast.error("Falha ao excluir estúdio.");
        }
    }, [refetchStudios]);

    const handleDeleteGame = useCallback(async (gameId: string) => {
        try {
            await deleteGameFromSupabase(gameId);
            refetchGames();
            toast.success("Jogo excluído com sucesso.");
        } catch (error) {
            console.error("Error deleting game:", error);
            toast.error("Falha ao excluir jogo.");
        }
    }, [refetchGames]);

    if (isSessionLoading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    if (!isAdmin) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">Acesso negado. Apenas administradores podem acessar este painel.</div>;
    }

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-3xl font-bold text-gogo-cyan">Painel de Administração</h1>

            {/* --- Gerenciamento de Estúdios --- */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-xl">
                        <Users className="h-5 w-5 mr-2" /> Gerenciar Estúdios
                    </CardTitle>
                    <Dialog open={isStudioFormOpen} onOpenChange={setIsStudioFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setIsStudioFormOpen(true)} className="bg-gogo-cyan hover:bg-gogo-cyan/90 text-white">
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Estúdio
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Estúdio</DialogTitle>
                            </DialogHeader>
                            <StudioForm onSave={handleAddStudio} onClose={() => setIsStudioFormOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {isStudiosLoading ? (
                        <p>Carregando estúdios...</p>
                    ) : studios.length === 0 ? (
                        <p className="text-muted-foreground">Nenhum estúdio cadastrado.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>ID</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studios.map((studio) => (
                                        <TableRow key={studio.id}>
                                            <TableCell className="font-medium">{studio.name}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{studio.id}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="sm" onClick={() => setEditingStudio(studio)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteStudio(studio.id)} className="text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Edição de Estúdio */}
            <Dialog open={!!editingStudio} onOpenChange={(open) => !open && setEditingStudio(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Estúdio</DialogTitle>
                    </DialogHeader>
                    {editingStudio && (
                        <EditStudioForm 
                            studio={editingStudio} 
                            onSave={handleUpdateStudio} 
                            onClose={() => setEditingStudio(null)} 
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* --- Gerenciamento de Jogos --- */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <Gamepad2 className="h-5 w-5 mr-2" /> Gerenciar Jogos (Todos)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isGamesLoading ? (
                        <p>Carregando jogos...</p>
                    ) : games.length === 0 ? (
                        <p className="text-muted-foreground">Nenhum jogo cadastrado no Supabase.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Estúdio ID</TableHead>
                                        <TableHead>Lançamento</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {games.map((game) => (
                                        <TableRow key={game.id}>
                                            <TableCell className="font-medium">{game.name}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{game.studio_id || 'Global'}</TableCell>
                                            <TableCell>{game.launch_date ? formatDate(new Date(game.launch_date)) : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <DeleteGameButton 
                                                    gameId={game.id}
                                                    gameName={game.name}
                                                    onDelete={handleDeleteGame}
                                                    variant="ghost"
                                                    size="sm"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminPanel;