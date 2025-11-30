import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ManualEventMarker } from '@/data/trackingData';
import { toast } from 'sonner';

// --- Schema ---

const EventMarkerFormSchema = z.object({
    date: z.string().min(1, "Data é obrigatória."),
    type: z.enum(['Launch', 'Major Update', 'Sale', 'Event', 'Other']),
    description: z.string().min(1, "Descrição é obrigatória."),
});

// --- Component ---

interface ManualEventMarkerFormProps {
    existingMarker?: ManualEventMarker;
    onSave: (marker: Omit<ManualEventMarker, 'id' | 'game'>) => void;
    onClose: () => void;
}

const ManualEventMarkerForm: React.FC<ManualEventMarkerFormProps> = ({ existingMarker, onSave, onClose }) => {
    const defaultDate = existingMarker?.date.toISOString().substring(0, 10) || new Date().toISOString().substring(0, 10);

    const form = useForm<z.infer<typeof EventMarkerFormSchema>>({
        resolver: zodResolver(EventMarkerFormSchema),
        defaultValues: {
            date: defaultDate,
            type: existingMarker?.type || 'Event',
            description: existingMarker?.description || '',
        },
    });

    const onSubmit = (values: z.infer<typeof EventMarkerFormSchema>) => {
        onSave({
            date: new Date(values.date),
            type: values.type,
            description: values.description,
        });
        onClose();
        toast.success(`Marcador de evento ${existingMarker ? 'atualizado' : 'adicionado'}.`);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Evento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {['Launch', 'Major Update', 'Sale', 'Event', 'Other'].map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">{existingMarker ? 'Salvar Alterações' : 'Adicionar Marcador'}</Button>
                </div>
            </form>
        </Form>
    );
};

export default ManualEventMarkerForm;