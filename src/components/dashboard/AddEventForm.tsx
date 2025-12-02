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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea'; // Removido
import { EventTrackingEntry } from '@/data/trackingData';
import { toast } from 'sonner';

// Schema de validação
const formSchema = z.object({
    game: z.string().min(1, "O jogo é obrigatório."),
    event: z.string().min(1, "O nome do evento é obrigatório."),
    startDate: z.string().min(1, "A data de início é obrigatória (YYYY-MM-DD)."),
    endDate: z.string().min(1, "A data final é obrigatória (YYYY-MM-DD)."),
    action: z.string().min(1, "A ação é obrigatória."),
    views: z.number().min(0).default(0),
    cost: z.number().min(0, "Custo deve ser um número positivo.").default(0),
    wlGenerated: z.number().min(0).default(0),
});

type EventFormValues = z.infer<typeof formSchema>;

interface AddEventFormProps {
    games: string[];
    onSave: (data: Omit<EventTrackingEntry, 'startDate' | 'endDate' | 'roi' | 'costPerView'> & { startDate: string, endDate: string }) => void;
    onClose: () => void;
}

const actions = ['KeyMailer', 'Participação presencial', 'Virtual', 'Outro'];

const AddEventForm: React.FC<AddEventFormProps> = ({ games, onSave, onClose }) => {
    const form = useForm<EventFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            game: games[0] || '',
            event: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            action: actions[0],
            views: 0,
            cost: 0,
            wlGenerated: 0,
        },
    });

    const onSubmit = (values: EventFormValues) => {
        onSave(values as any); 
        toast.success("Entrada de evento adicionada.");
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <FormField
                    control={form.control}
                    name="game"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jogo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o jogo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {games.map(game => (
                                        <SelectItem key={game} value={game}>{game}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="event"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Evento</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Steam Next Fest" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data de Início (YYYY-MM-DD)</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data Final (YYYY-MM-DD)</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ação Realizada</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ação" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {actions.map(a => (
                                        <SelectItem key={a} value={a}>{a}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Custo Participação (R$)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="0.00" 
                                        {...field} 
                                        onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="wlGenerated"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>WL Geradas</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        {...field} 
                                        onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="views"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Visualizações Alcançadas</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        {...field} 
                                        onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit">
                        Salvar Entrada
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default AddEventForm;