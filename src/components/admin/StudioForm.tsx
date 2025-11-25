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

const formSchema = z.object({
    name: z.string().min(1, "O nome do estúdio é obrigatório."),
});

type StudioFormValues = z.infer<typeof formSchema>;

interface StudioFormProps {
    existingStudio?: Studio | null;
    onSave: (name: string, id?: string) => void;
    onClose: () => void;
}

const StudioForm: React.FC<StudioFormProps> = ({ existingStudio, onSave, onClose }) => {
    const form = useForm<StudioFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: existingStudio?.name || '',
        },
    });

    const onSubmit = (values: StudioFormValues) => {
        onSave(values.name, existingStudio?.id);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Estúdio</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: GoGo Games Interactive" {...field} />
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
                        {existingStudio ? 'Salvar Alterações' : 'Criar Estúdio'}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default StudioForm;