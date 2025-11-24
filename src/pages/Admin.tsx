"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, User, Building2, Gamepad2, Trash2, Edit, Check, X, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    getAllProfiles,
    getAllStudios,
    getAllGames,
    updateStudio,
    deleteStudio,
    updateGame,
    deleteGame,
    updateProfileAdminStatus,
    Profile,
    Studio,
    Game,
} from '@/integrations/supabase/games';
import { useUserStudio } from '@/hooks/use-user-studio';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

// --- Forms de Edição ---

const StudioFormSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório."),
    owner_id: z.string().min(1, "O proprietário é obrigatório."),
});

interface EditStudioFormProps {
    studio: Studio;
    profiles: Profile[];
    onClose: () => void;
}

const EditStudioForm: React.FC<EditStudioFormProps> = ({ studio, profiles, onClose }) => {
    const queryClient = useQueryClient();
    const form = useForm({
        resolver: zodResolver(StudioFormSchema),
        defaultValues: {
            name: studio.name,
            owner_id: studio.owner_id,
        },
    });

    const mutation = useMutation({
        mutationFn: (data: z.infer<typeof StudioFormSchema>) => updateStudio(studio.id, data),
        onSuccess: () => {
            toast.success("Estúdio atualizado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['adminStudios'] });
            queryClient.invalidateQueries({ queryKey: ['supabaseGames'] }); // Games might be affected
            onClose();
        },
        onError: (error) => {
            toast.error(`Falha ao atualizar estúdio: ${error.message}`);
        },
    });

    const onSubmit = (data: z.infer<typeof StudioFormSchema>) => {
        mutation.mutate(data);
    };

    const getProfileLabel = (p: Profile) => {
        if (p.email && p.email !== 'N/A (Admin RLS restriction)') return `${p.email} (${p.first_name || 'Sem Nome'})`;
        return `${p.id.substring(0, 8)}... (${p.first_name || 'Sem Nome'})`;
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
            <h3 className="text-lg font-semibold">Editar Estúdio: {studio.name}</h3>
            <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Estúdio</label>
                <Input {...form.register('name')} />
                {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Proprietário (ID do Usuário)</label>
                <Select onValueChange={(value) => form.setValue('owner_id', value)} defaultValue={studio.owner_id}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o Proprietário" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {profiles.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                                {getProfileLabel(p)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {form.formState.errors.owner_id && <p className="text-xs text-red-500">{form.formState.errors.owner_id.message}</p>}
            </div>
            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
            </div>
        </form>
    );
};

// --- Painéis de Administração ---

const AdminUsersPanel: React.FC<{ profiles: Profile[], refetch: () => void }> = ({ profiles, refetch }) => {
    const queryClient = useQueryClient();
    const { session } = useUserStudio();
    
    const toggleAdminMutation = useMutation({
        mutationFn: ({ userId, isAdmin }: { userId: string, isAdmin: boolean }) => updateProfileAdminStatus(userId, isAdmin),
        onSuccess: () => {
            toast.success("Status de administrador atualizado.");
            queryClient.invalidateQueries({ queryKey: ['adminProfiles'] });
            // Force refetch of current user's profile if they changed their own status
            if (session?.user?.id) {
                queryClient.invalidateQueries({ queryKey: ['userStudio'] });
            }
        },
        onError: (error) => {
            toast.error(`Falha ao atualizar status: ${error.message}`);
        },
    });

    const getDisplayEmail = (p: Profile) => {
        if (p.email && p.email !== 'N/A (Admin RLS restriction)') return p.email;
        return `${p.id.substring(0, 8)}... (ID)`;
    };

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center"><User className="h-5 w-5 mr-2" /> Gerenciar Usuários</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email/ID</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead className="text-center">Admin</TableHead>
                            <TableHead className="w-[150px] text-center">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium text-sm">{getDisplayEmail(p)}</TableCell>
                                <TableCell>{p.first_name} {p.last_name}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={p.is_admin ? 'default' : 'secondary'} className={p.is_admin ? 'bg-gogo-orange hover:bg-gogo-orange/90' : ''}>
                                        {p.is_admin ? 'Sim' : 'Não'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    {session?.user?.id !== p.id ? (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => toggleAdminMutation.mutate({ userId: p.id, isAdmin: !p.is_admin })}
                                            disabled={toggleAdminMutation.isPending}
                                        >
                                            {p.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                                        </Button>
                                    ) : (
                                        <Badge variant="secondary">Você</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const AdminStudiosPanel: React.FC<{ studios: Studio[], profiles: Profile[], refetch: () => void }> = ({ studios, profiles, refetch }) => {
    const queryClient = useQueryClient();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState<string | null>(null);

    const deleteMutation = useMutation({
        mutationFn: deleteStudio,
        onSuccess: () => {
            toast.success("Estúdio excluído com sucesso.");
            queryClient.invalidateQueries({ queryKey: ['adminStudios'] });
            queryClient.invalidateQueries({ queryKey: ['supabaseGames'] });
        },
        onError: (error) => {
            toast.error(`Falha ao excluir estúdio: ${error.message}`);
        },
    });

    const getOwnerDisplay = (ownerId: string) => {
        const profile = profiles.find(p => p.id === ownerId);
        if (!profile) return 'Usuário Desconhecido';
        if (profile.email && profile.email !== 'N/A (Admin RLS restriction)') return profile.email;
        return `${profile.id.substring(0, 8)}...`;
    };

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center"><Building2 className="h-5 w-5 mr-2" /> Gerenciar Estúdios</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>ID do Estúdio</TableHead>
                            <TableHead>Proprietário</TableHead>
                            <TableHead className="w-[150px] text-center">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {studios.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{s.id}</TableCell>
                                <TableCell>{getOwnerDisplay(s.owner_id)}</TableCell>
                                <TableCell className="text-center flex items-center justify-center space-x-2">
                                    <Dialog open={isEditDialogOpen === s.id} onOpenChange={(open) => setIsEditDialogOpen(open ? s.id : null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gogo-cyan hover:bg-gogo-cyan/10">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[450px]">
                                            <DialogHeader>
                                                <DialogTitle>Editar Estúdio</DialogTitle>
                                            </DialogHeader>
                                            <EditStudioForm 
                                                studio={s} 
                                                profiles={profiles} 
                                                onClose={() => setIsEditDialogOpen(null)} 
                                            />
                                        </DialogContent>
                                    </Dialog>
                                    
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Excluir Estúdio?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação removerá permanentemente o estúdio "{s.name}" e **todos os jogos vinculados a ele**.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteMutation.mutate(s.id)} className="bg-destructive hover:bg-destructive/90">
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
            </CardContent>
        </Card>
    );
};

const AdminGamesPanel: React.FC<{ games: Game[], studios: Studio[], refetch: () => void }> = ({ games, studios, refetch }) => {
    const queryClient = useQueryClient();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState<string | null>(null);
    
    const deleteMutation = useMutation({
        mutationFn: deleteGame,
        onSuccess: () => {
            toast.success("Jogo excluído com sucesso.");
            queryClient.invalidateQueries({ queryKey: ['adminGames'] });
            queryClient.invalidateQueries({ queryKey: ['supabaseGames'] });
        },
        onError: (error) => {
            toast.error(`Falha ao excluir jogo: ${error.message}`);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Game> }) => updateGame(id, updates),
        onSuccess: () => {
            toast.success("Jogo atualizado com sucesso.");
            queryClient.invalidateQueries({ queryKey: ['adminGames'] });
            queryClient.invalidateQueries({ queryKey: ['supabaseGames'] });
            setIsEditDialogOpen(null);
        },
        onError: (error) => {
            toast.error(`Falha ao atualizar jogo: ${error.message}`);
        },
    });

    const getStudioName = (studioId: string | null) => {
        return studios.find(s => s.id === studioId)?.name || 'N/A';
    };

    const GameEditForm: React.FC<{ game: Game, onClose: () => void }> = ({ game, onClose }) => {
        const form = useForm({
            defaultValues: {
                studio_id: game.studio_id || '',
            }
        });

        const onSubmit = (values: { studio_id: string }) => {
            updateMutation.mutate({ id: game.id, updates: { studio_id: values.studio_id || null } });
        };

        return (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold">Editar Jogo: {game.name}</h3>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Vincular ao Estúdio</label>
                    <Select onValueChange={(value) => form.setValue('studio_id', value)} defaultValue={game.studio_id || ''}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o Estúdio" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="">Nenhum (Global/Admin)</SelectItem>
                            {studios.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                    </Button>
                </div>
            </form>
        );
    };

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center"><Gamepad2 className="h-5 w-5 mr-2" /> Gerenciar Jogos (Todos)</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>ID do Jogo</TableHead>
                            <TableHead>Estúdio Vinculado</TableHead>
                            <TableHead className="w-[150px] text-center">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {games.map(g => (
                            <TableRow key={g.id}>
                                <TableCell className="font-medium">{g.name}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{g.id}</TableCell>
                                <TableCell>{getStudioName(g.studio_id)}</TableCell>
                                <TableCell className="text-center flex items-center justify-center space-x-2">
                                    <Dialog open={isEditDialogOpen === g.id} onOpenChange={(open) => setIsEditDialogOpen(open ? g.id : null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gogo-cyan hover:bg-gogo-cyan/10">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[450px]">
                                            <DialogHeader>
                                                <DialogTitle>Editar Jogo</DialogTitle>
                                            </DialogHeader>
                                            <GameEditForm game={g} onClose={() => setIsEditDialogOpen(null)} />
                                        </DialogContent>
                                    </Dialog>
                                    
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Excluir Jogo?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação removerá permanentemente o jogo "{g.name}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteMutation.mutate(g.id)} className="bg-destructive hover:bg-destructive/90">
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
            </CardContent>
        </Card>
    );
};


const Admin: React.FC = () => {
    const { isAdmin, isLoadingStudio } = useUserStudio();
    const queryClient = useQueryClient();

    // Fetch all data needed for admin panels
    const { data: profiles = [], isLoading: isLoadingProfiles, refetch: refetchProfiles } = useQuery({
        queryKey: ['adminProfiles'],
        queryFn: getAllProfiles,
        enabled: isAdmin,
    });

    const { data: studios = [], isLoading: isLoadingStudios, refetch: refetchStudios } = useQuery({
        queryKey: ['adminStudios'],
        queryFn: getAllStudios,
        enabled: isAdmin,
    });

    const { data: games = [], isLoading: isLoadingGames, refetch: refetchGames } = useQuery({
        queryKey: ['adminGames'],
        queryFn: getAllGames,
        enabled: isAdmin,
    });

    if (isLoadingStudio || isLoadingProfiles || isLoadingStudios || isLoadingGames) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-gogo-cyan" />
                <p className="ml-3 text-lg">Carregando painel de administração...</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-background text-foreground">
                <Card className="p-6 shadow-xl border border-destructive">
                    <CardTitle className="text-2xl text-destructive">Acesso Negado</CardTitle>
                    <CardContent className="mt-4">
                        <p>Você não tem permissão de administrador para acessar esta página.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <h1 className="text-3xl font-bold text-gogo-orange flex items-center">
                <User className="h-6 w-6 mr-3" /> Painel de Administração
            </h1>
            <p className="text-muted-foreground">Gerencie usuários, estúdios e jogos em todo o sistema.</p>

            <Tabs defaultValue="users">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="users" className="flex items-center"><User className="h-4 w-4 mr-2" /> Usuários</TabsTrigger>
                    <TabsTrigger value="studios" className="flex items-center"><Building2 className="h-4 w-4 mr-2" /> Estúdios</TabsTrigger>
                    <TabsTrigger value="games" className="flex items-center"><Gamepad2 className="h-4 w-4 mr-2" /> Jogos</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="mt-4">
                    <AdminUsersPanel profiles={profiles} refetch={refetchProfiles} />
                </TabsContent>

                <TabsContent value="studios" className="mt-4">
                    <AdminStudiosPanel studios={studios} profiles={profiles} refetch={refetchStudios} />
                </TabsContent>

                <TabsContent value="games" className="mt-4">
                    <AdminGamesPanel games={games} studios={studios} refetch={refetchGames} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Admin;