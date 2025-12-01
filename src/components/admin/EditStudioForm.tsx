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
import { Studio } from '@/integrations/supabase/schema';

const formSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
});

type StudioFormValues = z.infer<typeof formSchema>;

interface EditStudioFormProps {
    studio: Studio;
    onSave: (id: string, name: string) => void;
    onClose: () => void;
}

const EditStudioForm: React.FC<EditStudioFormProps> = ({ studio, onSave, onClose }) => {
    const form = useForm<StudioFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: studio.name,
        },
    });

    const onSubmit = (values: StudioFormValues) => {
        onSave(studio.id, values.name);
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
                                <Input placeholder="Nome do Estúdio" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit">
                        Salvar Alterações
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default EditStudioForm;