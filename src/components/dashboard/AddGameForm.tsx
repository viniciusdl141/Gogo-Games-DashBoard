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
    gameName: z.string().min(1, "O nome do jogo é obrigatório."),
});

type GameFormValues = z.infer<typeof formSchema>;

interface AddGameFormProps {
    onSave: (gameName: string) => void;
    onClose: () => void;
}

const AddGameForm: React.FC<AddGameFormProps> = ({ onSave, onClose }) => {
    const form = useForm<GameFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gameName: '',
        },
    });

    const onSubmit = (values: GameFormValues) => {
        onSave(values.gameName.trim());
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