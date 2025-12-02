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
import { WLSalesPlatformEntry } from '@/data/trackingData';
import { toast } from 'sonner';

// Definindo o tipo de venda
const SaleTypeEnum = z.enum(['Padrão', 'Bundle', 'DLC']);
const FrequencyEnum = z.enum(['Diário', 'Semanal', 'Mensal']);
// Definindo o tipo de plataforma (Atualizado)
const PlatformEnum = z.enum(['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Android', 'iOS', 'Epic Games', 'Outra']);

// Schema de validação
const formSchema = z.object({
    id: z.string(),
    game: z.string().min(1, "O jogo é obrigatório."),
    platform: PlatformEnum.default('Steam'), // Novo campo
    date: z.string().min(1, "A data é obrigatória (formato YYYY-MM-DD)."),
    wishlists: z.number().min(0, "Wishlists deve ser um número positivo.").default(0),
    sales: z.number().min(0, "Vendas deve ser um número positivo.").default(0),
    saleType: SaleTypeEnum.default('Padrão'),
    frequency: FrequencyEnum.default('Diário'),
});

type WLSalesFormValues = z.infer<typeof formSchema>;

interface EditWLSalesFormProps {
    games: string[];
    entry: WLSalesPlatformEntry;
    onSave: (data: WLSalesPlatformEntry) => void;
    onClose: () => void;
}

const EditWLSalesForm: React.FC<EditWLSalesFormProps> = ({ games, entry, onSave, onClose }) => {
    const defaultDate = entry.date ? entry.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const form = useForm<WLSalesFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: entry.id,
            game: entry.game,
            platform: entry.platform,
            date: defaultDate,
            wishlists: entry.wishlists,
            sales: entry.sales,
            saleType: entry.saleType,
            frequency: entry.frequency,
        },
    });

    const onSubmit = (values: WLSalesFormValues) => {
        const dateObject = new Date(values.date);
        
        onSave({
            ...values,
            date: dateObject,
            variation: entry.variation, // Placeholder, will be recalculated in Dashboard
        } as WLSalesPlatformEntry); 
        
        toast.success("Entrada de Wishlist/Vendas atualizada.");
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="saleType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Venda</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tipo de Venda" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {SaleTypeEnum.options.map(type => (
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
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frequência da Entrada</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Frequência" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {FrequencyEnum.options.map(freq => (
                                            <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="wishlists"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Wishlists Totais na Data</FormLabel>
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
                        name="sales"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vendas Diárias (Unidades)</FormLabel>
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

export default EditWLSalesForm;