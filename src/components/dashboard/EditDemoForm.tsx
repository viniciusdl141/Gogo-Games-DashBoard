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
import { DemoTrackingEntry } from '@/data/trackingData';

const formSchema = z.object({
    id: z.string(),
    date: z.string().min(1, "A data é obrigatória (YYYY-MM-DD)."),
    downloads: z.number().min(0).default(0),
    avgPlaytime: z.string().min(1, "O tempo médio de jogo é obrigatório."),
    totalDemoTime: z.string().min(1, "O tempo total da demo é obrigatório."),
    totalGameTime: z.string().min(1, "O tempo total do jogo é obrigatório."),
});

type DemoFormValues = z.infer<typeof formSchema>;

interface EditDemoFormProps {
    entry: DemoTrackingEntry;
    onSave: (data: DemoTrackingEntry) => void;
    onClose: () => void;
}

const EditDemoForm: React.FC<EditDemoFormProps> = ({ entry, onSave, onClose }) => {
    const defaultDateString = entry.date ? entry.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const form = useForm<DemoFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: entry.id,
            date: defaultDateString,
            downloads: entry.downloads,
            avgPlaytime: entry.avgPlaytime,
            totalDemoTime: entry.totalDemoTime,
            totalGameTime: entry.totalGameTime,
        },
    });

    const onSubmit = (values: DemoFormValues) => {
        onSave({
            ...entry, // Keep original game name
            id: values.id,
            date: new Date(values.date),
            downloads: values.downloads,
            avgPlaytime: values.avgPlaytime,
            totalDemoTime: values.totalDemoTime,
            totalGameTime: values.totalGameTime,
        });
        toast.success("Entrada de Demo Tracking atualizada.");
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold">Editar Tracking de Demo para {entry.game}</h3>
                
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
                    <Button type="submit" className="bg-gogo-cyan hover:bg-gogo-cyan/90">Salvar Alterações</Button>
                </div>
            </form>
        </Form>
    );
};

export default EditDemoForm;