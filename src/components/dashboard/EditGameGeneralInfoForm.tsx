"use client";

import React, { useState, useCallback } from 'react';
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
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Removed
import { Image, Loader2, Search } from 'lucide-react';
// import { Game as SupabaseGame } from '@/integrations/supabase/schema'; // Removed
// import { updateGame } from '@/integrations/supabase/games'; // Removed
import { toast } from 'sonner';

// Placeholder function (assuming it should exist in games.ts or be implemented here)
// Since it's not exported from games.ts, I'll define a placeholder here to resolve the import error.
// NOTE: If this function is needed, it must be implemented fully. For now, it's a stub.
const fetchAndSetGameMetadata = async (gameName: string, _form: any) => { // Used _form to mark as unused
    console.warn(`fetchAndSetGameMetadata called for ${gameName}. Implementation needed.`);
    // Simulate fetching data
    await new Promise(resolve => setTimeout(resolve, 500));
    // Example: form.setValue('capsuleImageUrl', 'http://example.com/image.png');
};

// Schema de validação
const formSchema = z.object({
    launchDate: z.string().nullable().optional(),
    capsuleImageUrl: z.string().url("Deve ser uma URL válida.").nullable().optional().or(z.literal('')),
    category: z.string().nullable().optional().or(z.literal('')),
});

type EditGameFormValues = z.infer<typeof formSchema>;

interface EditGameGeneralInfoFormProps {
    gameId: string;
    gameName: string;
    currentLaunchDate: Date | null;
    currentCapsuleImageUrl: string | null;
    currentCategory: string | null;
    onUpdateLaunchDate: (gameId: string, launchDate: string | null, capsuleImageUrl: string | null, category: string | null) => void;
    onMetadataUpdate: () => void;
}

const EditGameGeneralInfoForm: React.FC<EditGameGeneralInfoFormProps> = ({
    gameId,
    gameName,
    currentLaunchDate,
    currentCapsuleImageUrl,
    currentCategory,
    onUpdateLaunchDate,
    onMetadataUpdate: _onMetadataUpdate, // Marked as unused
}) => {
    const [isSearching, setIsSearching] = useState(false);
    
    const defaultDate = currentLaunchDate ? currentLaunchDate.toISOString().split('T')[0] : '';

    const form = useForm<EditGameFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            launchDate: defaultDate || null,
            capsuleImageUrl: currentCapsuleImageUrl || null,
            category: currentCategory || null,
        },
    });

    const onSubmit = async (values: EditGameFormValues) => {
        const launchDate = values.launchDate || null;
        const capsuleImageUrl = values.capsuleImageUrl || null;
        const category = values.category || null;

        onUpdateLaunchDate(gameId, launchDate, capsuleImageUrl, category);
    };

    const handleSearchMetadata = useCallback(async () => {
        setIsSearching(true);
        try {
            // Chamada à função placeholder
            await fetchAndSetGameMetadata(gameName, form);
            toast.success("Busca de metadados concluída (simulada).");
        } catch (error) {
            toast.error("Falha ao buscar metadados.");
        } finally {
            setIsSearching(false);
        }
    }, [gameName, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold text-gogo-cyan">Editar Metadados de {gameName}</h3>
                
                <div className="flex space-x-2">
                    <Button 
                        type="button" 
                        onClick={handleSearchMetadata} 
                        disabled={isSearching}
                        variant="outline"
                        className="w-full"
                    >
                        {isSearching ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4 mr-2" />
                        )}
                        Buscar Metadados (Steam/API)
                    </Button>
                </div>

                <FormField
                    control={form.control}
                    name="launchDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data de Lançamento</FormLabel>
                            <FormControl>
                                <Input 
                                    type="date" 
                                    value={field.value || ''}
                                    onChange={e => field.onChange(e.target.value || null)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="capsuleImageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center">
                                <Image className="h-4 w-4 mr-2" /> URL da Imagem Cápsula
                            </FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="https://..." 
                                    {...field} 
                                    value={field.value || ''}
                                    onChange={e => field.onChange(e.target.value || null)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoria/Gênero Principal</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Ex: RPG, Ação, Plataforma" 
                                    {...field} 
                                    value={field.value || ''}
                                    onChange={e => field.onChange(e.target.value || null)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="submit" className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                        Salvar Metadados
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default EditGameGeneralInfoForm;