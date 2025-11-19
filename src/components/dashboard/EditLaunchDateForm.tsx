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
});

type LaunchDateFormValues = z.infer<typeof formSchema>;

interface EditLaunchDateFormProps {
    gameId: string;
    gameName: string;
    currentLaunchDate: Date | null;
    onSave: (gameId: string, launchDate: string | null) => void;
    onClose: () => void;
}

const EditLaunchDateForm: React.FC<EditLaunchDateFormProps> = ({ gameId, gameName, currentLaunchDate, onSave, onClose }) => {
    const defaultDateString = currentLaunchDate ? currentLaunchDate.toISOString().split('T')[0] : '';

    const form = useForm<LaunchDateFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            launchDate: defaultDateString,
        },
    });

    const onSubmit = (values: LaunchDateFormValues) => {
        onSave(gameId, values.launchDate || null);
        toast.success(`Data de lançamento para "${gameName}" atualizada.`);
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold">Editar Data de Lançamento para {gameName}</h3>
                
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

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" className="bg-gogo-cyan hover:bg-gogo-cyan/90">Salvar Data</Button>
                </div>
            </form>
        </Form>
    );
};

export default EditLaunchDateForm;