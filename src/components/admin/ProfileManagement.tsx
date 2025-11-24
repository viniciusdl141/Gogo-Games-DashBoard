"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile, Studio } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStudios, updateProfileStudio } from '@/integrations/supabase/studios';
import { useSession } from '@/components/SessionContextProvider';

interface ProfileWithEmail extends Profile {
    email: string;
}

const fetchProfiles = async (): Promise<ProfileWithEmail[]> => {
    // Fetch profiles and join with auth.users to get email
    const { data, error } = await supabase
        .from('profiles')
        .select('*, auth_user:auth.users(email)')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(p => ({
        ...p,
        email: (p.auth_user as any)?.email || 'N/A',
    })) as ProfileWithEmail[];
};

const ProfileManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const { profile: currentAdminProfile, refetchProfile } = useSession();
    const [selectedStudioId, setSelectedStudioId] = useState<string | null>(null);

    const { data: profiles, isLoading: isLoadingProfiles, error: errorProfiles } = useQuery<ProfileWithEmail[], Error>({
        queryKey: ['profiles'],
        queryFn: fetchProfiles,
    });

    const { data: studios, isLoading: isLoadingStudios } = useQuery<Studio[], Error>({
        queryKey: ['studios'],
        queryFn: getStudios,
        initialData: [],
    });

    const updateStudioMutation = useMutation({
        mutationFn: ({ profileId, studioId }: { profileId: string, studioId: string | null }) => updateProfileStudio(profileId, studioId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            // If the admin is updating their own profile, refresh session context
            if (variables.profileId === currentAdminProfile?.id) {
                refetchProfile();
            }
            toast.success("Estúdio do perfil atualizado com sucesso!");
        },
        onError: (e) => {
            toast.error(`Falha ao atualizar estúdio: ${e.message}`);
        }
    });

    if (isLoadingProfiles || isLoadingStudios) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gogo-cyan" /></div>;
    if (errorProfiles) return <Card><CardContent className="p-4 text-destructive">Erro ao carregar perfis: {errorProfiles.message}</CardContent></Card>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-gogo-orange">
                    <Users className="h-5 w-5 mr-2" /> Gerenciamento de Perfis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead className="w-[250px]">Estúdio Atual</TableHead>
                                <TableHead className="w-[250px]">Atribuir Novo Estúdio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles?.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.email}</TableCell>
                                    <TableCell>{p.first_name} {p.last_name}</TableCell>
                                    <TableCell>{p.is_admin ? 'Sim' : 'Não'}</TableCell>
                                    <TableCell>
                                        {studios.find(s => s.id === p.studio_id)?.name || 'Nenhum'}
                                    </TableCell>
                                    <TableCell className="flex items-center space-x-2">
                                        <Select 
                                            onValueChange={(value) => setSelectedStudioId(value === '' ? null : value)} 
                                            defaultValue={p.studio_id || ''}
                                        >
                                            <SelectTrigger className="w-[150px]">
                                                <SelectValue placeholder="Selecionar Estúdio" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">[Nenhum]</SelectItem>
                                                {studios.map(studio => (
                                                    <SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button 
                                            size="sm"
                                            onClick={() => updateStudioMutation.mutate({ profileId: p.id, studioId: selectedStudioId })}
                                            disabled={updateStudioMutation.isPending || selectedStudioId === undefined}
                                        >
                                            {updateStudioMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
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

export default ProfileManagement;