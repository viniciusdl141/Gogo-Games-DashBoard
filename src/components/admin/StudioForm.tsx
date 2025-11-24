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
import { Studio } from '@/integrations/supabase/studios';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(2, "O nome do estúdio é obrigatório."),
});

type StudioFormValues = z.infer<typeof formSchema>;

interface StudioFormProps {
    initialData?: Studio;
    onSave: (name: string) => Promise<void>;
    onClose: () => void;
    isSaving: boolean;
}

const StudioForm: React.FC<StudioFormProps> = ({ initialData, onSave, onClose, isSaving }) => {
    const form = useForm<StudioFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || '',
        },
    });

    const onSubmit = async (values: StudioFormValues) => {
        await onSave(values.name);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold">{initialData ? 'Editar Estúdio' : 'Criar Novo Estúdio'}</h3>
                
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Estúdio</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Gogo Games Interactive" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            initialData ? 'Salvar Alterações' : 'Criar Estúdio'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default StudioForm;