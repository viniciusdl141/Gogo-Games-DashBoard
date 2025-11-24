"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudios, addStudio, updateStudio, deleteStudio, Studio } from '@/integrations/supabase/studios';
import { getProfiles, updateProfile, Profile } from '@/integrations/supabase/profiles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Loader2, User, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import StudioForm from './StudioForm';
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

const StudioList: React.FC = () => {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStudio, setEditingStudio] = useState<Studio | undefined>(undefined);

    const { data: studios, isLoading: isLoadingStudios } = useQuery<Studio[], Error>({
        queryKey: ['studios'],
        queryFn: getStudios,
    });

    const { data: profiles, isLoading: isLoadingProfiles } = useQuery<Profile[], Error>({
        queryKey: ['profiles'],
        queryFn: getProfiles,
    });

    const createMutation = useMutation({
        mutationFn: addStudio,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['studios'] });
            toast.success("Estúdio criado com sucesso!");
            setIsFormOpen(false);
        },
        onError: (error) => {
            toast.error(`Falha ao criar estúdio: ${error.message}`);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, name }: { id: string, name: string }) => updateStudio(id, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['studios'] });
            toast.success("Estúdio atualizado com sucesso!");
            setIsFormOpen(false);
            setEditingStudio(undefined);
        },
        onError: (error) => {
            toast.error(`Falha ao atualizar estúdio: ${error.message}`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteStudio,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['studios'] });
            queryClient.invalidateQueries({ queryKey: ['profiles'] }); // Profiles might lose studio_id
            toast.success("Estúdio excluído com sucesso.");
        },
        onError: (error) => {
            toast.error(`Falha ao excluir estúdio: ${error.message}`);
        },
    });

    const handleSaveStudio = async (name: string) => {
        if (editingStudio) {
            await updateMutation.mutateAsync({ id: editingStudio.id, name });
        } else {
            await createMutation.mutateAsync(name);
        }
    };

    const handleEdit = (studio: Studio) => {
        setEditingStudio(studio);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingStudio(undefined);
    };

    // --- User Management ---
    
    const updateProfileMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Profile> }) => updateProfile(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            queryClient.invalidateQueries({ queryKey: ['supabaseGames'] }); // Games might change visibility
            toast.success("Perfil atualizado.");
        },
        onError: (error) => {
            toast.error(`Falha ao atualizar perfil: ${error.message}`);
        },
    });

    const handleAssignStudio = (profileId: string, studioId: string | null) => {
        updateProfileMutation.mutate({ id: profileId, updates: { studio_id: studioId } });
    };
    
    const handleToggleAdmin = (profileId: string, currentRole: 'admin' | 'user') => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        updateProfileMutation.mutate({ id: profileId, updates: { role: newRole } });
    };

    const usersWithoutStudio = useMemo(() => {
        return profiles?.filter(p => !p.studio_id && p.role !== 'admin') || [];
    }, [profiles]);

    const usersByStudio = useMemo(() => {
        const map = new Map<string, Profile[]>();
        if (studios && profiles) {
            studios.forEach(studio => {
                map.set(studio.id, profiles.filter(p => p.studio_id === studio.id));
            });
        }
        return map;
    }, [studios, profiles]);
    
    const adminUsers = useMemo(() => {
        return profiles?.filter(p => p.role === 'admin') || [];
    }, [profiles]);


    if (isLoadingStudios || isLoadingProfiles) {
        return <Loader2 className="h-8 w-8 animate-spin text-gogo-cyan mx-auto mt-10" />;
    }

    return (
        <div className="space-y-8">
            
            {/* Studio Management */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Estúdios Registrados ({studios?.length || 0})</CardTitle>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleEdit(undefined as any)} size="sm" className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                                <Plus className="h-4 w-4 mr-2" /> Novo Estúdio
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[450px]">
                            <DialogHeader>
                                <DialogTitle>{editingStudio ? 'Editar Estúdio' : 'Criar Novo Estúdio'}</DialogTitle>
                            </DialogHeader>
                            <StudioForm 
                                initialData={editingStudio}
                                onSave={handleSaveStudio}
                                onClose={handleCloseForm}
                                isSaving={createMutation.isPending || updateMutation.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead className="text-center">Membros</TableHead>
                                <TableHead className="w-[150px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studios?.map(studio => (
                                <TableRow key={studio.id}>
                                    <TableCell className="font-medium">{studio.name}</TableCell>
                                    <TableCell className="text-center">
                                        {usersByStudio.get(studio.id)?.length || 0}
                                    </TableCell>
                                    <TableCell className="text-center flex items-center justify-center space-x-2">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gogo-cyan hover:bg-gogo-cyan/10" onClick={() => handleEdit(studio)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Excluir o estúdio "{studio.name}" removerá a atribuição de todos os usuários e jogos vinculados.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteMutation.mutate(studio.id)} className="bg-destructive hover:bg-destructive/90">
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
            
            {/* User Management */}
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="w-[200px]">Estúdio Atribuído</TableHead>
                                <TableHead className="w-[150px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Admin Users */}
                            {adminUsers.map(profile => (
                                <TableRow key={profile.id} className="bg-gogo-orange/10">
                                    <TableCell className="font-medium flex items-center space-x-2">
                                        <User className="h-4 w-4 text-gogo-orange" />
                                        <span>{profile.email}</span>
                                    </TableCell>
                                    <TableCell className="font-bold text-gogo-orange">ADMIN</TableCell>
                                    <TableCell>
                                        {studios?.find(s => s.id === profile.studio_id)?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {profile.email === 'viniciusgamejamplus@gmail.com' ? (
                                            <Button variant="ghost" size="sm" disabled>
                                                <Check className="h-4 w-4 mr-2" /> Fixo
                                            </Button>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => handleToggleAdmin(profile.id, profile.role)}>
                                                Tornar Usuário
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            
                            {/* Regular Users */}
                            {profiles?.filter(p => p.role === 'user').map(profile => (
                                <TableRow key={profile.id}>
                                    <TableCell className="font-medium">{profile.email}</TableCell>
                                    <TableCell>{profile.role.toUpperCase()}</TableCell>
                                    <TableCell>
                                        <Select onValueChange={(studioId) => handleAssignStudio(profile.id, studioId === '' ? null : studioId)} value={profile.studio_id || ''}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Atribuir Estúdio" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Remover Estúdio</SelectItem>
                                                {studios?.map(studio => (
                                                    <SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="outline" size="sm" onClick={() => handleToggleAdmin(profile.id, profile.role)}>
                                            Tornar Admin
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default StudioList;