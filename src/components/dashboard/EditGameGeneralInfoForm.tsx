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
    capsuleImageUrl: z.string().url("Deve ser uma URL válida.").nullable().optional().or(z.literal('')), // Novo campo
});

type GameMetadataFormValues = z.infer<typeof formSchema>;

interface EditGameGeneralInfoFormProps {
    gameId: string;
    gameName: string;
    currentLaunchDate: Date | null;
    currentCapsuleImageUrl: string | null; // Novo prop
    onSave: (gameId: string, launchDate: string | null, capsuleImageUrl: string | null) => void;
    onClose: () => void;
}

const EditGameGeneralInfoForm: React.FC<EditGameGeneralInfoFormProps> = ({ gameId, gameName, currentLaunchDate, currentCapsuleImageUrl, onSave, onClose }) => {
    const defaultDateString = currentLaunchDate ? currentLaunchDate.toISOString().split('T')[0] : '';

    const form = useForm<GameMetadataFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            launchDate: defaultDateString,
            capsuleImageUrl: currentCapsuleImageUrl || '',
        },
    });

    const onSubmit = (values: GameMetadataFormValues) => {
        const imageUrl = values.capsuleImageUrl?.trim() || null;
        onSave(gameId, values.launchDate || null, imageUrl);
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