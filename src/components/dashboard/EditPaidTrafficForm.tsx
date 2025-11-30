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
import { PaidTrafficEntry } from '@/data/trackingData';
import { toast } from 'sonner';

// Schema de validação
const formSchema = z.object({
    id: z.string(),
    game: z.string().min(1, "O jogo é obrigatório."),
    network: z.string().min(1, "A rede é obrigatória."),
    startDate: z.string().min(1, "A data de início é obrigatória (YYYY-MM-DD)."),
    endDate: z.string().min(1, "A data final é obrigatória (YYYY-MM-DD)."),
    impressions: z.number().min(0).default(0),
    clicks: z.number().min(0).default(0),
    investedValue: z.number().min(0, "Valor investido deve ser positivo.").default(0),
    estimatedWishlists: z.number().min(0).default(0),
});

type PaidTrafficFormValues = z.infer<typeof formSchema>;

interface EditPaidTrafficFormProps {
    games: string[];
    entry: PaidTrafficEntry;
    onSave: (data: PaidTrafficEntry) => void;
    onClose: () => void;
}

const networks = ['Meta', 'Reddit', 'Youtube', 'Tiktok', 'Google Ads', 'Outro'];

const EditPaidTrafficForm: React.FC<EditPaidTrafficFormProps> = ({ games, entry, onSave, onClose }) => {
    const defaultStartDate = entry.startDate ? entry.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const defaultEndDate = entry.endDate ? entry.endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const form = useForm<PaidTrafficFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: entry.id,
            game: entry.game,
            network: entry.network,
            startDate: defaultStartDate,
            endDate: defaultEndDate,
            impressions: entry.impressions,
            clicks: entry.clicks,
            investedValue: entry.investedValue,
            estimatedWishlists: entry.estimatedWishlists,
        },
    });

    const onSubmit = (values: PaidTrafficFormValues) => {
        const startDateObject = new Date(values.startDate);
        const endDateObject = new Date(values.endDate);
        const networkConversion = values.impressions > 0 ? values.clicks / values.impressions : 0;
        const estimatedCostPerWL = values.estimatedWishlists > 0 ? values.investedValue / values.estimatedWishlists : '-';

        onSave({
            ...values,
            startDate: startDateObject,
            endDate: endDateObject,
            networkConversion: networkConversion,
            estimatedCostPerWL: estimatedCostPerWL,
            validatedCostPerWL: '-', // Mantemos como '-' após edição manual, a menos que seja validado
        } as PaidTrafficEntry);
        toast.success("Entrada de tráfego pago atualizada.");
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
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
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
                    name="network"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rede Social/Plataforma</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a Rede" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {networks.map(n => (
                                        <SelectItem key={n} value={n}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <FormField
                        control={form.control}
                        name="investedValue"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Investido (R$)</FormLabel>
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
                        name="estimatedWishlists"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>WL Est.</FormLabel>
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
                    <Button type="submit" className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                        Salvar Alterações
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default EditPaidTrafficForm;