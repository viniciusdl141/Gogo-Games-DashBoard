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
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
    date: z.string().min(1, "A data é obrigatória (YYYY-MM-DD)."),
    downloads: z.number().min(0).default(0),
    avgPlaytime: z.string().min(1, "O tempo médio de jogo é obrigatório."),
    totalDemoTime: z.string().min(1, "O tempo total da demo é obrigatório."),
    totalGameTime: z.string().min(1, "O tempo total do jogo é obrigatório."),
});

type DemoFormValues = z.infer<typeof formSchema>;

interface AddDemoFormProps {
    gameName: string;
    onSave: (data: DemoFormValues) => void;
    onClose: () => void;
}

const AddDemoForm: React.FC<AddDemoFormProps> = ({ gameName, onSave, onClose }) => {
    const form = useForm<DemoFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            downloads: 0,
            avgPlaytime: '',
            totalDemoTime: '',
            totalGameTime: '',
        },
    });

    const onSubmit = (values: DemoFormValues) => {
        onSave(values);
        toast.success(`Nova entrada de Demo Tracking adicionada para ${gameName}.`);
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold">Adicionar Tracking de Demo para {gameName}</h3>
                
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data (YYYY-MM-DD)</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="downloads"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número de Downloads</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="avgPlaytime"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tempo Médio de Jogo Demo</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: 15 Min" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="totalDemoTime"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tempo Total da Demo</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: 20-30 minutos" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="totalGameTime"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tempo Total do Jogo</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: 4 horas" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" className="bg-gogo-cyan hover:bg-gogo-cyan/90">Salvar Entrada</Button>
                </div>
            </form>
        </Form>
    );
};

export default AddDemoForm;