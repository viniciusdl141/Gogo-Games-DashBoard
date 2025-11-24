"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Profile, Studio } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Check, Clock, Building2 } from 'lucide-react';
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
import { getStudios } from '@/integrations/supabase/studios';
import { useSession } from '@/components/SessionContextProvider';
import { fetchProfilesForAdmin, updateProfileApprovalAndStudio, ProfileWithEmail } from '@/integrations/supabase/profiles';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const UserManagementPanel: React.FC = () => {
    const queryClient = useQueryClient();
    const { profile: currentAdminProfile, refetchProfile } = useSession();
    // State to track pending changes before saving
    const [pendingStudioUpdates, setPendingStudioUpdates] = useState<Record<string, string | null>>({});
    const [pendingAdminUpdates, setPendingAdminUpdates] = useState<Record<string, boolean>>({});

    const { data: profiles, isLoading: isLoadingProfiles, error: errorProfiles } = useQuery<ProfileWithEmail[], Error>({
        queryKey: ['profiles'],
        queryFn: fetchProfilesForAdmin,
    });

    const { data: studios, isLoading: isLoadingStudios } = useQuery<Studio[], Error>({
        queryKey: ['studios'],
        queryFn: getStudios,
        initialData: [],
    });

    const updateProfileMutation = useMutation({
        mutationFn: ({ profileId, is_approved, studio_id, is_admin }: { profileId: string, is_approved: boolean, studio_id: string | null, is_admin: boolean }) => 
            updateProfileApprovalAndStudio(profileId, is_approved, studio_id, is_admin),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            // Clear pending updates for the saved profile
            setPendingStudioUpdates(prev => {
                const newState = { ...prev };
                delete newState[variables.profileId];
                return newState;
            });
            setPendingAdminUpdates(prev => {
                const newState = { ...prev };
                delete newState[variables.profileId];
                return newState;
            });
            
            if (variables.profileId === currentAdminProfile?.id) {
                refetchProfile();
            }
            toast.success("Perfil atualizado com sucesso!");
        },
        onError: (e) => {
            toast.error(`Falha ao atualizar perfil: ${e.message}`);
        }
    });
    
    const handleUpdateStudio = (profileId: string, studioId: string | null) => {
        setPendingStudioUpdates(prev => ({ ...prev, [profileId]: studioId }));
    };
    
    const handleUpdateAdminStatus = (profileId: string, isAdmin: boolean) => {
        setPendingAdminUpdates(prev => ({ ...prev, [profileId]: isAdmin }));
    };

    const handleApproveAndSave = (profile: ProfileWithEmail) => {
        // Use pending state if available, otherwise use current profile value
        const newStudioId = pendingStudioUpdates[profile.id] !== undefined ? pendingStudioUpdates[profile.id] : profile.studio_id;
        const newIsAdmin = pendingAdminUpdates[profile.id] !== undefined ? pendingAdminUpdates[profile.id] : profile.is_admin;
        
        updateProfileMutation.mutate({
            profileId: profile.id,
            is_approved: true, // Approve the user
            studio_id: newStudioId,
            is_admin: newIsAdmin,
        });
    };
    
    const handleSaveApproved = (profile: ProfileWithEmail) => {
        const newStudioId = pendingStudioUpdates[profile.id] !== undefined ? pendingStudioUpdates[profile.id] : profile.studio_id;
        const newIsAdmin = pendingAdminUpdates[profile.id] !== undefined ? pendingAdminUpdates[profile.id] : profile.is_admin;
        
        updateProfileMutation.mutate({
            profileId: profile.id,
            is_approved: profile.is_approved, // Keep current approval status
            studio_id: newStudioId,
            is_admin: newIsAdmin,
        });
    };


    if (isLoadingProfiles || isLoadingStudios) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gogo-cyan" /></div>;
    if (errorProfiles) return <Card><CardContent className="p-4 text-destructive">Erro ao carregar perfis: {errorProfiles.message}</CardContent></Card>;

    const pendingProfiles = profiles?.filter(p => !p.is_approved) || [];
    const approvedProfiles = profiles?.filter(p => p.is_approved) || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-gogo-orange">
                    <Users className="h-5 w-5 mr-2" /> Gerenciamento de Usuários
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                
                {/* Pending Approvals Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center text-gogo-orange">
                        <Clock className="h-5 w-5 mr-2" /> Aprovações Pendentes ({pendingProfiles.length})
                    </h3>
                    {pendingProfiles.length === 0 ? (
                        <p className="text-muted-foreground">Nenhum usuário aguardando aprovação.</p>
                    ) : (
                        <div className="overflow-x-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead className="w-[150px]">Estúdio</TableHead>
                                        <TableHead className="w-[100px] text-center">Admin?</TableHead>
                                        <TableHead className="w-[150px] text-center">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingProfiles.map((p) => {
                                        // Determine current state based on pending updates or profile default
                                        const currentStudioId = pendingStudioUpdates[p.id] !== undefined ? pendingStudioUpdates[p.id] : p.studio_id;
                                        const currentIsAdmin = pendingAdminUpdates[p.id] !== undefined ? pendingAdminUpdates[p.id] : p.is_admin;
                                        
                                        return (
                                            <TableRow key={p.id} className="bg-yellow-50/50 dark:bg-yellow-900/20">
                                                <TableCell className="font-medium">{p.email}</TableCell>
                                                <TableCell>{p.first_name} {p.last_name}</TableCell>
                                                <TableCell>
                                                    <Select 
                                                        onValueChange={(value) => handleUpdateStudio(p.id, value === '' ? null : value)} 
                                                        defaultValue={currentStudioId || ''}
                                                    >
                                                        <SelectTrigger className="w-full h-8">
                                                            <SelectValue placeholder="Selecionar Estúdio" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="">[Nenhum]</SelectItem>
                                                            {studios.map(studio => (
                                                                <SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Switch 
                                                        checked={currentIsAdmin}
                                                        onCheckedChange={(checked) => handleUpdateAdminStatus(p.id, checked)}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => handleApproveAndSave(p)}
                                                        disabled={updateProfileMutation.isPending}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <Check className="h-4 w-4 mr-1" /> Aprovar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                {/* Approved Users Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center text-gogo-cyan">
                        <Building2 className="h-5 w-5 mr-2" /> Usuários Aprovados ({approvedProfiles.length})
                    </h3>
                    <div className="overflow-x-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead className="w-[100px] text-center">Admin</TableHead>
                                    <TableHead className="w-[200px]">Estúdio</TableHead>
                                    <TableHead className="w-[150px] text-center">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {approvedProfiles.map((p) => {
                                    // Determine current state based on pending updates or profile default
                                    const currentStudioId = pendingStudioUpdates[p.id] !== undefined ? pendingStudioUpdates[p.id] : p.studio_id;
                                    const currentIsAdmin = pendingAdminUpdates[p.id] !== undefined ? pendingAdminUpdates[p.id] : p.is_admin;
                                    const studioName = studios.find(s => s.id === currentStudioId)?.name || 'Nenhum';

                                    return (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.email}</TableCell>
                                            <TableCell>{p.first_name} {p.last_name}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={currentIsAdmin ? 'default' : 'secondary'} className={currentIsAdmin ? 'bg-gogo-orange hover:bg-gogo-orange/90' : ''}>
                                                    {currentIsAdmin ? 'Sim' : 'Não'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Select 
                                                    onValueChange={(value) => handleUpdateStudio(p.id, value === '' ? null : value)} 
                                                    defaultValue={currentStudioId || ''}
                                                >
                                                    <SelectTrigger className="w-full h-8">
                                                        <SelectValue placeholder={studioName} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="">[Nenhum]</SelectItem>
                                                        {studios.map(studio => (
                                                            <SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleSaveApproved(p)}
                                                    disabled={updateProfileMutation.isPending}
                                                    className="bg-gogo-cyan hover:bg-gogo-cyan/90"
                                                >
                                                    <Check className="h-4 w-4" /> Salvar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserManagementPanel;