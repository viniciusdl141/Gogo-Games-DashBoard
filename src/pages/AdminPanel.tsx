"use client";

import React, { useState, useMemo } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Home, Edit, Trash2, Users, Gamepad2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { getStudios, addStudio, updateStudio, deleteStudio, Studio } from '@/integrations/supabase/studios';
import { getGames, Game as SupabaseGame } from '@/integrations/supabase/games';
import StudioForm from '@/components/admin/StudioForm';
import UserForm from '@/components/admin/UserForm';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const AdminPanel: React.FC = () => {
    const { isAdmin, isLoading: isSessionLoading } = useSession();
    const navigate = useNavigate();
    const [isStudioFormOpen, setIsStudioFormOpen] = useState(false);
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [editingStudio, setEditingStudio] = useState<Studio | null>(null);

    // Fetch Studios
    const { data: studios, isLoading: isStudiosLoading, refetch: refetchStudios } = useQuery<Studio[], Error>({
        queryKey: ['studios'],
        queryFn: getStudios,
        enabled: isAdmin,
    });

    // Fetch All Games (Admin view)
    const { data: allGames, isLoading: isGamesLoading, refetch: refetchGames } = useQuery<SupabaseGame[], Error>({
        queryKey: ['allGamesAdmin'],
        queryFn: () => getGames(undefined), // Admin fetches all games (studioId undefined)
        enabled: isAdmin,
    });

    // Group games by studio ID for display
    const gamesByStudio = useMemo(() => {
        if (!allGames) return new Map<string, SupabaseGame[]>();
        return allGames.reduce((acc, game) => {
            const studioId = game.studio_id || 'unassigned';
            if (!acc.has(studioId)) {
                acc.set(studioId, []);
            }
            acc.get(studioId)?.push(game);
            return acc;
        }, new Map<string, SupabaseGame[]>());
    }, [allGames]);

    if (isSessionLoading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando sessão...</div>;
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

    // --- Handlers ---

    const handleSaveStudio = async (name: string, id?: string) => {
        try {
            if (id) {
                await updateStudio(id, { name });
                toast.success(`Estúdio "${name}" atualizado.`);
            } else {
                await addStudio(name);
                toast.success(`Estúdio "${name}" criado com sucesso.`);
            }
            refetchStudios();
            setIsStudioFormOpen(false);
            setEditingStudio(null);
        } catch (error) {
            console.error("Error saving studio:", error);
            toast.error("Falha ao salvar estúdio.");
        }
    };

    const handleDeleteStudio = async (id: string, name: string) => {
        try {
            // Check if any games are assigned to this studio
            const gamesAssigned = allGames?.filter(g => g.studio_id === id) || [];
            if (gamesAssigned.length > 0) {
                toast.error(`Não é possível deletar o estúdio "${name}". ${gamesAssigned.length} jogos ainda estão atribuídos a ele.`);
                return;
            }

            await deleteStudio(id);
            refetchStudios();
            toast.success(`Estúdio "${name}" deletado.`);
        } catch (error) {
            console.error("Error deleting studio:", error);
            toast.error("Falha ao deletar estúdio.");
        }
    };

    const handleEditStudio = (studio: Studio) => {
        setEditingStudio(studio);
        setIsStudioFormOpen(true);
    };

    const handleCloseStudioForm = () => {
        setIsStudioFormOpen(false);
        setEditingStudio(null);
    };

    const getStudioName = (id: string | null) => {
        if (!id) return 'Não Atribuído (Admin)';
        return studios?.find(s => s.id === id)?.name || 'Estúdio Desconhecido';
    };

    return (
        <div className="min-h-screen p-4 md:p-8 font-sans gaming-background">
            <div className="space-y-8 max-w-6xl mx-auto bg-card p-6 rounded-lg shadow-xl border border-border">
                <DashboardHeader />
                
                <h1 className="text-3xl font-bold text-gogo-orange flex items-center">
                    <Settings className="h-6 w-6 mr-3" /> Painel de Administração
                </h1>

                <Button onClick={() => navigate('/')} variant="outline" className="mb-4">
                    <Home className="h-4 w-4 mr-2" /> Voltar ao Dashboard
                </Button>

                {/* --- Gerenciamento de Estúdios --- */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl flex items-center">
                            <Users className="h-5 w-5 mr-2 text-gogo-cyan" /> Gerenciar Estúdios
                        </CardTitle>
                        <div className="flex space-x-2">
                            <Button onClick={() => setIsUserFormOpen(true)} className="bg-gogo-orange hover:bg-gogo-orange/90">
                                <Plus className="h-4 w-4 mr-2" /> Criar Usuário
                            </Button>
                            <Button onClick={() => setIsStudioFormOpen(true)} className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                                <Plus className="h-4 w-4 mr-2" /> Criar Estúdio
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isStudiosLoading ? (
                            <div className="flex justify-center items-center h-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome do Estúdio</TableHead>
                                            <TableHead>ID</TableHead>
                                            <TableHead className="text-center">Jogos Atribuídos</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studios?.map(studio => (
                                            <TableRow key={studio.id}>
                                                <TableCell className="font-medium">{studio.name}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{studio.id}</TableCell>
                                                <TableCell className="text-center">{gamesByStudio.get(studio.id)?.length || 0}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditStudio(studio)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Excluir Estúdio?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Tem certeza que deseja remover o estúdio "{studio.name}"? Isso não pode ser desfeito.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteStudio(studio.id, studio.name)} className="bg-destructive hover:bg-destructive/90">
                                                                    Excluir
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* --- Visualização de Todos os Jogos --- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center">
                            <Gamepad2 className="h-5 w-5 mr-2 text-gogo-orange" /> Todos os Jogos ({allGames?.length || 0})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isGamesLoading ? (
                            <div className="flex justify-center items-center h-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Jogo</TableHead>
                                            <TableHead>Estúdio</TableHead>
                                            <TableHead>Preço Sugerido (R$)</TableHead>
                                            <TableHead>Lançamento</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allGames?.map(game => (
                                            <TableRow key={game.id}>
                                                <TableCell className="font-medium">{game.name}</TableCell>
                                                <TableCell>{getStudioName(game.studio_id)}</TableCell>
                                                <TableCell>{game.suggested_price ? `R$ ${game.suggested_price.toFixed(2)}` : '-'}</TableCell>
                                                <TableCell>{game.launch_date ? formatDate(new Date(game.launch_date)) : '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Modals */}
                <Dialog open={isStudioFormOpen} onOpenChange={handleCloseStudioForm}>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle>{editingStudio ? 'Editar Estúdio' : 'Criar Novo Estúdio'}</DialogTitle>
                        </DialogHeader>
                        <StudioForm 
                            existingStudio={editingStudio}
                            onSave={handleSaveStudio}
                            onClose={handleCloseStudioForm}
                        />
                    </DialogContent>
                </Dialog>

                <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Usuário de Estúdio</DialogTitle>
                        </DialogHeader>
                        <UserForm 
                            studios={studios || []}
                            onClose={() => setIsUserFormOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminPanel;