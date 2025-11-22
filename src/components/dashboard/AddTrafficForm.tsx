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
import { Platform } from '@/data/trackingData';
import { toast } from 'sonner';

const PlatformEnum = z.enum(['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Android', 'iOS', 'Epic Games', 'Outra']);

// Schema de validação
const formSchema = z.object({
    game: z.string().min(1, "O jogo é obrigatório."),
    platform: PlatformEnum.default('Steam'),
    source: z.string().min(1, "A fonte é obrigatória."),
    startDate: z.string().min(1, "A data de início é obrigatória (YYYY-MM-DD)."),
    endDate: z.string().min(1, "A data final é obrigatória (YYYY-MM-DD)."),
    visits: z.number().min(0).default(0),
    impressions: z.number().min(0).default(0).optional(),
    clicks: z.number().min(0).default(0).optional(),
});

type TrafficFormValues = z.infer<typeof formSchema>;

interface AddTrafficFormProps {
    games: string[];
    onSave: (data: TrafficFormValues) => void;
    onClose: () => void;
}

const AddTrafficForm: React.FC<AddTrafficFormProps> = ({ games, onSave, onClose }) => {
    const form = useForm<TrafficFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            game: games[0] || '',
            platform: 'Steam', // Default para Steam
            source: 'Steam Analytics', // Default para Steam Analytics
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            visits: 0,
            impressions: 0,
            clicks: 0,
        },
    });

    const onSubmit = (values: TrafficFormValues) => {
        onSave(values); 
        toast.success("Entrada de tráfego/visitas adicionada.");
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold">Adicionar Dados de Tráfego/Visitas</h3>
                
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

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="platform"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Plataforma</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a Plataforma" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {PlatformEnum.options.map(p => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fonte de Dados</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Steam Analytics" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="visits"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Visitas/Page Views</FormLabel>
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
                        name="impressions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Impressões (Opcional)</FormLabel>
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
                        name="clicks"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cliques (Opcional)</FormLabel>
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
                        Salvar Tráfego
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default AddTrafficForm;