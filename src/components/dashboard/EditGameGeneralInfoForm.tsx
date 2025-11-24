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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Studio } from '@/types/supabase';

const formSchema = z.object({
    launchDate: z.string().nullable().optional(), // YYYY-MM-DD format
    capsuleImageUrl: z.string().url("Deve ser uma URL válida.").nullable().optional().or(z.literal('')),
    studioId: z.string().nullable().optional(), // New field for studio assignment
});

type GameMetadataFormValues = z.infer<typeof formSchema>;

interface EditGameGeneralInfoFormProps {
    gameId: string;
    gameName: string;
    currentLaunchDate: Date | null;
    currentCapsuleImageUrl: string | null;
    currentStudioId: string | null; // New prop
    isAdmin: boolean; // New prop
    studios: Studio[]; // New prop
    onSave: (gameId: string, launchDate: string | null, capsuleImageUrl: string | null, studioId: string | null) => void;
    onClose: () => void;
}

const EditGameGeneralInfoForm: React.FC<EditGameGeneralInfoFormProps> = ({ 
    gameId, 
    gameName, 
    currentLaunchDate, 
    currentCapsuleImageUrl, 
    currentStudioId,
    isAdmin,
    studios,
    onSave, 
    onClose 
}) => {
    const defaultDateString = currentLaunchDate ? currentLaunchDate.toISOString().split('T')[0] : '';

    const form = useForm<GameMetadataFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            launchDate: defaultDateString,
            capsuleImageUrl: currentCapsuleImageUrl || '',
            studioId: currentStudioId || '',
        },
    });

    const onSubmit = (values: GameMetadataFormValues) => {
        const imageUrl = values.capsuleImageUrl?.trim() || null;
        const studioId = isAdmin ? values.studioId || null : currentStudioId;
        
        onSave(gameId, values.launchDate || null, imageUrl, studioId);
        toast.success(`Informações gerais para "${gameName}" atualizadas.`);
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold">Editar Informações Gerais do Jogo: {gameName}</h3>
                
                {isAdmin && (
                    <FormField
                        control={form.control}
                        name="studioId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estúdio Associado (Admin)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o Estúdio" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="">[Nenhum Estúdio]</SelectItem>
                                        {studios.map(studio => (
                                            <SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

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
                                    value={field.value || ''} // Ensure controlled component
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