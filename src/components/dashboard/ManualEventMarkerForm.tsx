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
import { ManualEventMarker } from '@/data/trackingData';
import { Trash2 } from 'lucide-react';

const formSchema = z.object({
    date: z.string().min(1, "A data é obrigatória (YYYY-MM-DD)."),
    name: z.string().min(1, "O nome do evento é obrigatório."),
});

type MarkerFormValues = z.infer<typeof formSchema>;

interface ManualEventMarkerFormProps {
    gameName: string;
    existingMarker?: ManualEventMarker;
    onSave: (data: MarkerFormValues) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

const ManualEventMarkerForm: React.FC<ManualEventMarkerFormProps> = ({ gameName, existingMarker, onSave, onDelete, onClose }) => {
    const defaultDate = existingMarker?.date ? existingMarker.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const form = useForm<MarkerFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: defaultDate,
            name: existingMarker?.name || '',
        },
    });

    const onSubmit = (values: MarkerFormValues) => {
        onSave(values);
        toast.success(`Marcador de evento para ${gameName} salvo.`);
        onClose();
    };

    const handleDelete = () => {
        if (existingMarker) {
            onDelete(existingMarker.id);
            toast.success(`Marcador de evento removido.`);
            onClose();
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold">{existingMarker ? 'Editar Marcador' : 'Adicionar Marcador Manual de Evento'}</h3>
                
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data (YYYY-MM-DD)</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} disabled={!!existingMarker} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Evento/Ação</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Grande Promoção" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-between pt-4">
                    {existingMarker ? (
                        <Button type="button" variant="destructive" onClick={handleDelete} className="flex items-center">
                            <Trash2 className="h-4 w-4 mr-2" /> Remover
                        </Button>
                    ) : (
                        <div />
                    )}
                    <div className="flex space-x-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-gogo-cyan hover:bg-gogo-cyan/90">Salvar Marcador</Button>
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default ManualEventMarkerForm;