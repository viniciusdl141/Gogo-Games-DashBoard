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
import { Loader2, Search, Check, Calendar, DollarSign, Gamepad } from 'lucide-react';
import { invokeGameDataFetcher, GameOption } from '@/integrations/supabase/functions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

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
    const [results, setResults] = useState<GameOption[]>([]);
    
    // Usando a chave fornecida pelo usuário como valor inicial
    const initialApiKey = 'AIzaSyCao7UHpJgeYGExguqjvecUwdeztYhnxWU'; 

    const form = useForm<WebSearchFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gameName: '',
            aiApiKey: initialApiKey,
        },
    });

    const handleSearch = async (values: WebSearchFormValues) => {
        setIsLoading(true);
        setResults([]);
        toast.loading(`Buscando dados públicos para "${values.gameName}"...`, { id: 'web-search' });

        try {
            const response = await invokeGameDataFetcher(values.gameName, values.aiApiKey);
            
            toast.dismiss('web-search');

            if (response.results && response.results.length > 0) {
                setResults(response.results.filter(r => r.name)); // Filter out empty names
                toast.success(`${response.results.length} resultados encontrados. Selecione o jogo correto.`);
            } else {
                toast.error(`A busca não encontrou resultados para "${values.gameName}". Tente refinar o nome.`);
            }

        } catch (error) {
            console.error("Web Search Error:", error);
            toast.dismiss('web-search');
            toast.error(`Falha na busca: ${error.message}. Verifique a chave da API e o nome do jogo.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectGame = (game: GameOption) => {
        const launchDate = game.launchDate || null;
        const suggestedPrice = game.suggestedPrice || 0;
        
        onSave(game.name.trim(), launchDate, suggestedPrice);
        toast.success(`Jogo "${game.name}" selecionado e salvo.`);
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4 p-4">
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
                    <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4 mr-2" />
                        )}
                        Buscar Dados
                    </Button>
                </div>
            </form>

            {/* Resultados da Busca */}
            {results.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border space-y-3 max-h-60 overflow-y-auto">
                    <h4 className="font-semibold text-md flex items-center text-gogo-orange">
                        <Gamepad className="h-4 w-4 mr-2" /> Resultados Encontrados:
                    </h4>
                    {results.map((game, index) => (
                        <Card key={index} className="p-3 hover:bg-muted/50 transition-colors">
                            <CardContent className="p-0 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">{game.name}</p>
                                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                                        <span className="flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" /> 
                                            {game.launchDate ? formatDate(new Date(game.launchDate)) : 'Data N/A'}
                                        </span>
                                        <span className="flex items-center">
                                            <DollarSign className="h-3 w-3 mr-1" /> 
                                            {game.suggestedPrice ? formatCurrency(game.suggestedPrice) : 'Preço N/A'}
                                        </span>
                                        <span className="text-xs italic">({game.source})</span>
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    onClick={() => handleSelectGame(game)}
                                    className="bg-gogo-cyan hover:bg-gogo-cyan/90"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </Form>
    );
};

export default WebSearchGameForm;