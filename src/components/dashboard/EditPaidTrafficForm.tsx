import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PaidTrafficEntry, Platform, GameMetrics } from '@/data/trackingData';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/lib/utils';

// --- Schema ---

const EditPaidTrafficFormSchema = z.object({
    game: z.string().min(1, "Jogo é obrigatório."),
    network: z.string().min(1, "Rede é obrigatória."),
    platform: z.string().min(1, "Plataforma é obrigatória."),
    date: z.string().min(1, "Data é obrigatória."),
    impressions: z.coerce.number().min(0, "Impressões devem ser >= 0."),
    clicks: z.coerce.number().min(0, "Cliques devem ser >= 0."),
    wishlists: z.coerce.number().min(0, "Wishlists devem ser >= 0."),
    sales: z.coerce.number().min(0, "Vendas devem ser >= 0."),
    cost: z.coerce.number().min(0, "Custo deve ser >= 0."),

    // New fields for detailed paid traffic tracking
    startDate: z.string().min(1, "Data de Início é obrigatória."),
    endDate: z.string().min(1, "Data de Fim é obrigatória."),
    investedValue: z.coerce.number().min(0, "Valor Investido deve ser >= 0."),
    estimatedWishlists: z.coerce.number().min(0, "WLs Estimados devem ser >= 0."),
});

// --- Component ---

interface EditPaidTrafficFormProps {
    games: GameMetrics[];
    entry: PaidTrafficEntry;
    onSave: (updatedEntry: PaidTrafficEntry) => void;
    onClose: () => void;
}

const EditPaidTrafficForm: React.FC<EditPaidTrafficFormProps> = ({ games, entry, onSave, onClose }) => {
    const defaultStartDate = entry.startDate ? entry.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const defaultEndDate = entry.endDate ? entry.endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const form = useForm<z.infer<typeof EditPaidTrafficFormSchema>>({
        resolver: zodResolver(EditPaidTrafficFormSchema),
        defaultValues: {
            game: entry.game,
            network: entry.network,
            platform: entry.platform,
            date: entry.date.toISOString().substring(0, 10),
            impressions: entry.impressions,
            clicks: entry.clicks,
            wishlists: entry.wishlists,
            sales: entry.sales,
            cost: entry.cost,
            // Default values for new fields
            startDate: defaultStartDate,
            endDate: defaultEndDate,
            investedValue: entry.investedValue || 0,
            estimatedWishlists: entry.estimatedWishlists || 0,
        },
    });

    const onSubmit = (values: z.infer<typeof EditPaidTrafficFormSchema>) => {
        const updatedEntry: PaidTrafficEntry = {
            ...entry,
            game: values.game,
            network: values.network,
            platform: values.platform as Platform,
            date: new Date(values.date),
            impressions: values.impressions,
            clicks: values.clicks,
            wishlists: values.wishlists,
            sales: values.sales,
            cost: values.cost,
            // Updated detailed fields
            startDate: new Date(values.startDate),
            endDate: new Date(values.endDate),
            investedValue: values.investedValue,
            estimatedWishlists: values.estimatedWishlists,
        };

        onSave(updatedEntry);
        onClose();
        toast.success("Entrada de Tráfego Pago atualizada.");
    };

    // Calculating derived metrics for display
    const clicks = form.watch('clicks') || 0;
    const impressions = form.watch('impressions') || 0;
    const investedValue = form.watch('investedValue') || 0;
    const wishlists = form.watch('wishlists') || 0;

    const networkConversion = impressions > 0 ? (clicks / impressions) : 0;
    const estimatedCostPerWL = wishlists > 0 ? investedValue / wishlists : 0;
    const validatedCostPerWL = entry.wishlists > 0 ? entry.cost / entry.wishlists : 0;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                    {games.map(g => (
                                        <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
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
                            <FormLabel>Rede de Tráfego</FormLabel>
                            <FormControl>
                                <Input {...field} />
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
                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data de Início</FormLabel>
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
                                <FormLabel>Data de Fim</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data de Registro</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="impressions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Impressões</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
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
                                    <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
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
                                <FormLabel>Valor Investido (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                        name="estimatedWishlists"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>WLs Estimados</FormLabel>
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
                <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Custo (R$)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium">Conversão Rede (Clicks/Impressions):</p>
                        <p className="text-lg font-bold text-gogo-cyan">{(networkConversion * 100).toFixed(2)}%</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium">Custo Estimado por WL:</p>
                        <p className="text-lg font-bold">{formatCurrency(estimatedCostPerWL, 'BRL')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium">Custo Validado por WL:</p>
                        <p className="text-lg font-bold">{formatCurrency(validatedCostPerWL, 'BRL')}</p>
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Alterações</Button>
                </div>
            </form>
        </Form>
    );
};

export default EditPaidTrafficForm;