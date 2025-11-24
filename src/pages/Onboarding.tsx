"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStudio } from '@/hooks/use-user-studio';
import { createStudio } from '@/integrations/supabase/games';

const formSchema = z.object({
    studioName: z.string().min(3, "O nome do estúdio deve ter pelo menos 3 caracteres."),
});

type StudioFormValues = z.infer<typeof formSchema>;

const Onboarding: React.FC = () => {
    const { session, isLoading: isLoadingSession } = useUserStudio();
    const { profile, refetchStudio } = useUserStudio();
    const navigate = useNavigate();

    const form = useForm<StudioFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            studioName: profile?.first_name ? `${profile.first_name}'s Studio` : '',
        },
    });

    const onSubmit = async (values: StudioFormValues) => {
        if (!session?.user?.id) {
            toast.error("Sessão de usuário não encontrada.");
            return;
        }

        try {
            await createStudio(values.studioName, session.user.id);
            toast.success(`Estúdio "${values.studioName}" criado com sucesso!`);
            
            // Refetch studio data to update the global state and trigger redirection in App.tsx
            await refetchStudio();
            navigate('/');
        } catch (error) {
            console.error("Error creating studio:", error);
            toast.error("Falha ao criar estúdio. Tente novamente.");
        }
    };

    if (isLoadingSession) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

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
                        Bem-vindo! Para começar a usar o dashboard, precisamos criar seu estúdio de jogos.
                    </p>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="studioName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Estúdio</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Meu Estúdio Incrível" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button 
                                type="submit" 
                                className="w-full bg-gogo-cyan hover:bg-gogo-cyan/90"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    'Criar Estúdio e Continuar'
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