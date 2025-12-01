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

// Definindo o tipo de plataforma (Apenas plataformas principais)
const PlatformEnum = z.enum(['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Android', 'iOS', 'Epic Games', 'Outra']);

// Exportando o schema Zod para uso em WlDetailsManager
export const AddTrafficFormSchema = z.object({
    platform: PlatformEnum.default('Steam'),
    source: z.string().min(1, "A fonte é obrigatória."),
    startDate: z.string().min(1, "A data de início é obrigatória."),
    endDate: z.string().min(1, "A data final é obrigatória."),
    visits: z.number().min(0, "Visitas devem ser positivas.").default(0),
    impressions: z.number().min(0, "Impressões devem ser positivas.").default(0),
    clicks: z.number().min(0, "Cliques devem ser positivos.").default(0),
});

type AddTrafficFormValues = z.infer<typeof AddTrafficFormSchema>;

interface AddTrafficFormProps {
    gameName: string;
    onSave: (values: AddTrafficFormValues & { game: string, platform: Platform }) => void;
    onClose: () => void;
}

const AddTrafficForm: React.FC<AddTrafficFormProps> = ({ gameName, onSave, onClose }) => {
    const form = useForm<AddTrafficFormValues>({
        resolver: zodResolver(AddTrafficFormSchema),
        defaultValues: {
            platform: 'Steam',
            source: 'Steam Analytics',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            visits: 0,
            impressions: 0,
            clicks: 0,
        },
    });

    const onSubmit = (values: AddTrafficFormValues) => {
        onSave({ ...values, game: gameName, platform: values.platform });
        toast.success("Entrada de tráfego adicionada.");
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold text-gogo-cyan mb-4">Jogo: {gameName}</h3>
                
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
                            <FormLabel>Fonte do Tráfego</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Steam Analytics, Google Ads" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data Início</FormLabel>
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
                                <FormLabel>Data Final</FormLabel>
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
                                <FormLabel>Visitas</FormLabel>
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
                                <FormLabel>Impressões</FormLabel>
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
                                <FormLabel>Cliques</FormLabel>
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