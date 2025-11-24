"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudios, createStudio, deleteStudio } from '@/integrations/supabase/studios';
import { Studio } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { useSession } from '@/components/SessionContextProvider';

const StudioManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const { profile } = useSession();
    const [newStudioName, setNewStudioName] = useState('');

    const { data: studios, isLoading, error } = useQuery<Studio[], Error>({
        queryKey: ['studios'],
        queryFn: getStudios,
    });

    const addStudioMutation = useMutation({
        mutationFn: (name: string) => createStudio(name, profile?.id || null),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['studios'] });
            setNewStudioName('');
            toast.success("Estúdio criado com sucesso!");
        },
        onError: (e) => {
            toast.error(`Falha ao criar estúdio: ${e.message}`);
        }
    });

    const deleteStudioMutation = useMutation({
        mutationFn: (id: string) => deleteStudio(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['studios'] });
            toast.success("Estúdio excluído com sucesso!");
        },
        onError: (e) => {
            toast.error(`Falha ao excluir estúdio: ${e.message}`);
        }
    });

    if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gogo-cyan" /></div>;
    if (error) return <Card><CardContent className="p-4 text-destructive">Erro ao carregar estúdios: {error.message}</CardContent></Card>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-gogo-orange">
                    <Building2 className="h-5 w-5 mr-2" /> Gerenciamento de Estúdios
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Add Studio Form */}
                <div className="flex space-x-2">
                    <Input
                        placeholder="Nome do Novo Estúdio"
                        value={newStudioName}
                        onChange={(e) => setNewStudioName(e.target.value)}
                        disabled={addStudioMutation.isPending}
                    />
                    <Button 
                        onClick={() => addStudioMutation.mutate(newStudioName)} 
                        disabled={!newStudioName.trim() || addStudioMutation.isPending}
                        className="bg-gogo-cyan hover:bg-gogo-cyan/90"
                    >
                        {addStudioMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Studios List */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead className="w-[100px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studios?.map((studio) => (
                                <TableRow key={studio.id}>
                                    <TableCell className="font-medium">{studio.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{studio.id}</TableCell>
                                    <TableCell className="text-center">
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
                                                        Esta ação removerá permanentemente o estúdio "{studio.name}".
                                                        Isso pode afetar perfis e jogos associados.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={() => deleteStudioMutation.mutate(studio.id)} 
                                                        className="bg-destructive hover:bg-destructive/90"
                                                        disabled={deleteStudioMutation.isPending}
                                                    >
                                                        Remover
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
            </CardContent>
        </Card>
    );
};

export default StudioManagement;