"use client";

import React, { useState } from 'react';
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
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { invokeGameDataFetcher } from '@/integrations/supabase/functions';

const formSchema = z.object({
    gameName: z.string().min(1, "O nome do jogo é obrigatório."),
    aiApiKey: z.string().min(1, "A chave da API é obrigatória."),
});

type WebSearchFormValues = z.infer<typeof formSchema>;

interface WebSearchGameFormProps {
    onSave: (gameName: string, launchDate: string | null, suggestedPrice: number) => void;
    onClose: () => void;
}

const WebSearchGameForm: React.FC<WebSearchGameFormProps> = ({ onSave, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    
    // Usando a chave fornecida pelo usuário como valor inicial
    const initialApiKey = 'AIzaSyCao7UHpJgeYGExguqjvecUwdeztYhnxWU'; 

    const form = useForm<WebSearchFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gameName: '',
            aiApiKey: initialApiKey,
        },
    });

    const onSubmit = async (values: WebSearchFormValues) => {
        setIsLoading(true);
        toast.loading(`Buscando dados públicos para "${values.gameName}"...`, { id: 'web-search' });

        try {
            const response = await invokeGameDataFetcher(values.gameName, values.aiApiKey);
            
            toast.dismiss('web-search');

            if (response.launchDate || response.suggestedPrice) {
                const launchDate = response.launchDate || null;
                const suggestedPrice = response.suggestedPrice || 0;
                
                onSave(values.gameName.trim(), launchDate, suggestedPrice);
                toast.success(`Dados de lançamento encontrados e salvos para "${values.gameName}".`);
                onClose();
            } else {
                toast.error(`A busca não encontrou dados de lançamento ou preço para "${values.gameName}". Tente adicionar manualmente.`);
            }

        } catch (error) {
            console.error("Web Search Error:", error);
            toast.dismiss('web-search');
            toast.error(`Falha na busca: ${error.message}. Verifique a chave da API e o nome do jogo.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold text-gogo-cyan">Busca Web (Gemini)</h3>
                <p className="text-sm text-muted-foreground">Use o nome exato do jogo para buscar a data de lançamento e o preço sugerido na Steam.</p>
                
                <FormField
                    control={form.control}
                    name="gameName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Jogo</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: My Awesome Game" {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="aiApiKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Chave da API Gemini</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="AIzaSy..." {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4 mr-2" />
                        )}
                        Buscar Dados
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default WebSearchGameForm;