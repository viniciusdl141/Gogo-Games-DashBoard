"use client";

import React from 'react';
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

const formSchema = z.object({
    launchDate: z.string().nullable().optional(), // YYYY-MM-DD format
    capsuleImageUrl: z.string().url("Deve ser uma URL válida.").nullable().optional().or(z.literal('')),
    suggestedPrice: z.number().min(0).default(0).optional(), // Price in BRL
    priceUsd: z.number().min(0).default(0).optional(), // Price in USD
    developer: z.string().nullable().optional(),
    publisher: z.string().nullable().optional(),
    reviewSummary: z.string().nullable().optional(),
});

type GameMetadataFormValues = z.infer<typeof formSchema>;

interface EditGameGeneralInfoFormProps {
    gameId: string;
    gameName: string;
    currentLaunchDate: Date | null;
    currentCapsuleImageUrl: string | null;
    currentSuggestedPrice: number | null; // NEW PROP
    currentPriceUsd: number | null; // NEW PROP
    currentDeveloper: string | null; // NEW PROP
    currentPublisher: string | null; // NEW PROP
    currentReviewSummary: string | null; // NEW PROP
    onSave: (gameId: string, updates: { 
        launchDate: string | null, 
        capsuleImageUrl: string | null, 
        suggestedPrice: number | null,
        priceUsd: number | null,
        developer: string | null,
        publisher: string | null,
        reviewSummary: string | null,
    }) => void;
    onClose: () => void;
}

const EditGameGeneralInfoForm: React.FC<EditGameGeneralInfoFormProps> = ({ 
    gameId, 
    gameName, 
    currentLaunchDate, 
    currentCapsuleImageUrl, 
    currentSuggestedPrice,
    currentPriceUsd,
    currentDeveloper,
    currentPublisher,
    currentReviewSummary,
    onSave, 
    onClose 
}) => {
    const defaultDateString = currentLaunchDate ? currentLaunchDate.toISOString().split('T')[0] : '';

    const form = useForm<GameMetadataFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            launchDate: defaultDateString,
            capsuleImageUrl: currentCapsuleImageUrl || '',
            suggestedPrice: currentSuggestedPrice || 0,
            priceUsd: currentPriceUsd || 0,
            developer: currentDeveloper || '',
            publisher: currentPublisher || '',
            reviewSummary: currentReviewSummary || '',
        },
    });

    const onSubmit = (values: GameMetadataFormValues) => {
        const updates = {
            launchDate: values.launchDate || null,
            capsuleImageUrl: values.capsuleImageUrl?.trim() || null,
            suggestedPrice: values.suggestedPrice || null,
            priceUsd: values.priceUsd || null,
            developer: values.developer?.trim() || null,
            publisher: values.publisher?.trim() || null,
            reviewSummary: values.reviewSummary?.trim() || null,
        };
        onSave(gameId, updates);
        toast.success(`Informações gerais para "${gameName}" atualizadas.`);
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold">Editar Informações Gerais do Jogo: {gameName}</h3>
                
                <FormField
                    control={form.control}
                    name="launchDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data de Lançamento (YYYY-MM-DD)</FormLabel>
                            <FormControl>
                                <Input 
                                    type="date" 
                                    {...field} 
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="suggestedPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Preço Sugerido (R$)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="19.99" 
                                        {...field} 
                                        onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="priceUsd"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Preço Sugerido (USD)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="4.99" 
                                        {...field} 
                                        onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="developer"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Desenvolvedora</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Gogo Games Studio" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="publisher"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Distribuidora</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Gogo Games Publishing" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <FormField
                    control={form.control}
                    name="reviewSummary"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Resumo de Reviews (Steam)</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Muito Positivas" {...field} value={field.value || ''} />
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
                            <FormLabel>URL da Imagem da Cápsula</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="https://..." 
                                    {...field} 
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" className="bg-gogo-cyan hover:bg-gogo-cyan/90">Salvar Alterações</Button>
                </div>
            </form>
        </Form>
    );
};

export default EditGameGeneralInfoForm;