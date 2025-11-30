import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WLSalesPlatformEntry, SaleType, EntryFrequency, Platform } from '@/data/trackingData';
import { toast } from 'sonner';

// --- Schema ---

const AddWLSalesFormSchema = z.object({
    date: z.string().min(1, "Data é obrigatória."),
    wishlists: z.coerce.number().min(0, "Wishlists devem ser >= 0."),
    sales: z.coerce.number().min(0, "Vendas devem ser >= 0."),
    saleType: z.enum(['Padrão', 'Bundle', 'DLC']).default('Padrão'),
    frequency: z.enum(['Diário', 'Semanal', 'Mensal']).default('Diário'),
});

// --- Component ---

interface AddWLSalesFormProps {
    wlSalesData: WLSalesPlatformEntry[];
    onSave: (data: Omit<WLSalesPlatformEntry, 'id' | 'date' | 'variation'> & { date: string, saleType: SaleType, frequency: EntryFrequency, platform: Platform }) => void;
    onClose: () => void;
}

const AddWLSalesForm: React.FC<AddWLSalesFormProps> = ({ wlSalesData, onSave, onClose }) => {
    const form = useForm<z.infer<typeof AddWLSalesFormSchema>>({
        resolver: zodResolver(AddWLSalesFormSchema),
        defaultValues: {
            date: new Date().toISOString().substring(0, 10),
            wishlists: 0,
            sales: 0,
            saleType: 'Padrão',
            frequency: 'Diário',
        },
    });

    const onSubmit = (values: z.infer<typeof AddWLSalesFormSchema>) => {
        // The platform is handled by the parent component (WLSalesPanelThemed)
        onSave(values as any); // Casting to any because platform is added by parent
        onClose();
        toast.success("Entrada de WL/Vendas adicionada.");
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
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="wishlists"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Wishlists</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
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
                                <FormLabel>Vendas</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="saleType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Venda</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {['Padrão', 'Bundle', 'DLC'].map(type => (
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
                                <FormLabel>Frequência</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a frequência" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {['Diário', 'Semanal', 'Mensal'].map(freq => (
                                            <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Adicionar Entrada</Button>
                </div>
            </form>
        </Form>
    );
};

export default AddWLSalesForm;