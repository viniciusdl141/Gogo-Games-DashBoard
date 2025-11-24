"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStudio } from '@/hooks/use-user-studio';
import { getAllStudiosForSelection, linkProfileToStudio, Studio } from '@/integrations/supabase/games';
import { useQuery } from '@tanstack/react-query';

const formSchema = z.object({
    studioId: z.string().min(1, "A seleção do estúdio é obrigatória."),
});

type StudioFormValues = z.infer<typeof formSchema>;

const Onboarding: React.FC = () => {
    const { session, isLoading: isLoadingSession } = useUserStudio();
    const { refetchStudio } = useUserStudio();
    const navigate = useNavigate();

    // Fetch all studios available for selection
    const { data: studios = [], isLoading: isLoadingStudios } = useQuery<Studio[], Error>({
        queryKey: ['allStudios'],
        queryFn: getAllStudiosForSelection,
    });

    const form = useForm<StudioFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            studioId: '',
        },
    });

    const onSubmit = async (values: StudioFormValues) => {
        if (!session?.user?.id) {
            toast.error("Sessão de usuário não encontrada.");
            return;
        }

        try {
            await linkProfileToStudio(session.user.id, values.studioId);
            toast.success(`Perfil vinculado ao estúdio com sucesso!`);
            
            // Refetch studio data to update the global state and trigger redirection in App.tsx
            await refetchStudio();
            navigate('/');
        } catch (error) {
            console.error("Error linking studio:", error);
            toast.error("Falha ao vincular estúdio. Verifique as permissões.");
        }
    };

    if (isLoadingSession || isLoadingStudios) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 gaming-background">
                <Loader2 className="h-8 w-8 animate-spin text-gogo-cyan" />
            </div>
        );
    }
    
    if (studios.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 gaming-background">
                <Card className="w-full max-w-md shadow-gogo-orange-glow">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-gogo-orange flex items-center">
                            <Building2 className="h-6 w-6 mr-2" /> Configuração Inicial
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-6 text-muted-foreground">
                            Nenhum estúdio disponível para seleção. Por favor, peça a um administrador para criar um estúdio.
                        </p>
                        <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                            Voltar ao Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 gaming-background">
            <Card className="w-full max-w-md shadow-gogo-orange-glow">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gogo-orange flex items-center">
                        <Building2 className="h-6 w-6 mr-2" /> Selecione Seu Estúdio
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-6 text-muted-foreground">
                        Bem-vindo! Por favor, selecione o estúdio de jogos ao qual você pertence para acessar o dashboard.
                    </p>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="studioId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estúdio</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o Estúdio" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {studios.map(studio => (
                                                    <SelectItem key={studio.id} value={studio.id}>
                                                        {studio.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button 
                                type="submit" 
                                className="w-full bg-gogo-cyan hover:bg-gogo-cyan/90"
                                disabled={form.formState.isSubmitting || !form.formState.isValid}
                            >
                                {form.formState.isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    'Vincular e Acessar Dashboard'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Onboarding;