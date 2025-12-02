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

const formSchema = z.object({
    gameName: z.string().min(1, "O nome do jogo é obrigatório."),
    launchDate: z.string().nullable().optional(), // YYYY-MM-DD format
    suggestedPrice: z.number().min(0).default(0).optional(), // Suggested price in BRL
});

type GameFormValues = z.infer<typeof formSchema>;

interface AddGameFormProps {
    onSave: (gameName: string, launchDate: string | null, suggestedPrice: number) => void;
    onClose: () => void;
}

const AddGameForm: React.FC<AddGameFormProps> = ({ onSave, onClose }) => {
    const form = useForm<GameFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gameName: '',
            launchDate: '',
            suggestedPrice: 19.99,
        },
    });

    const onSubmit = (values: GameFormValues) => {
        onSave(values.gameName.trim(), values.launchDate || null, values.suggestedPrice || 0);
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <FormField
                    control={form.control}
                    name="gameName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Novo Jogo</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: My Awesome Game" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="launchDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data de Lançamento (Opcional)</FormLabel>
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

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                        Adicionar Jogo
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default AddGameForm;