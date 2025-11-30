import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DemoTrackingEntry, Platform, GameMetrics } from '@/data/trackingData';
import { toast } from 'sonner';

// --- Schema ---

const EditDemoFormSchema = z.object({
    date: z.string().min(1, "Data é obrigatória."),
    platform: z.string().min(1, "Plataforma é obrigatória."),
    downloads: z.coerce.number().min(0, "Downloads devem ser >= 0."),
    wishlists: z.coerce.number().min(0, "Wishlists devem ser >= 0."),
    sales: z.coerce.number().min(0, "Vendas devem ser >= 0."),
    
    // New fields for detailed demo tracking
    avgPlaytime: z.coerce.number().min(0, "Tempo médio de jogo deve ser >= 0."),
    totalDemoTime: z.coerce.number().min(0, "Tempo total de demo deve ser >= 0."),
    totalGameTime: z.coerce.number().min(0, "Tempo total de jogo deve ser >= 0."),
});

// --- Component ---

interface EditDemoFormProps {
    games: GameMetrics[];
    entry: DemoTrackingEntry;
    onSave: (updatedEntry: DemoTrackingEntry) => void;
    onClose: () => void;
}

const EditDemoForm: React.FC<EditDemoFormProps> = ({ entry, onSave, onClose }) => {
    const form = useForm<z.infer<typeof EditDemoFormSchema>>({
        resolver: zodResolver(EditDemoFormSchema),
        defaultValues: {
            date: entry.date.toISOString().substring(0, 10),
            platform: entry.platform,
            downloads: entry.downloads,
            wishlists: entry.wishlists,
            sales: entry.sales,
            // Default values for new fields
            avgPlaytime: entry.avgPlaytime,
            totalDemoTime: entry.totalDemoTime,
            totalGameTime: entry.totalGameTime,
        },
    });

    const onSubmit = (values: z.infer<typeof EditDemoFormSchema>) => {
        const updatedEntry: DemoTrackingEntry = {
            ...entry,
            date: new Date(values.date),
            platform: values.platform as Platform,
            downloads: values.downloads,
            wishlists: values.wishlists,
            sales: values.sales,
            avgPlaytime: values.avgPlaytime,
            totalDemoTime: values.totalDemoTime,
            totalGameTime: values.totalGameTime,
        };
        onSave(updatedEntry);
        onClose();
        toast.success("Entrada de Demo atualizada.");
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
                    name="platform"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Plataforma</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a plataforma" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Epic Games', 'Outra'].map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
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
                        name="downloads"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Downloads</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                </div>
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
                <Separator />
                <h4 className="text-md font-semibold">Métricas de Tempo de Jogo (Opcional)</h4>
                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="avgPlaytime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tempo Médio (min)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
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
                                <FormLabel>Total Demo (h)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
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
                                <FormLabel>Total Jogo (h)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Alterações</Button>
                </div>
            </form>
        </Form>
    );
};

export default EditDemoForm;