import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventTrackingEntry, Platform, GameMetrics } from '@/data/trackingData';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/lib/utils';

// --- Schema ---

const EditEventFormSchema = z.object({
    game: z.string().min(1, "Jogo é obrigatório."),
    event: z.string().min(1, "Nome do Evento é obrigatório."),
    platform: z.string().min(1, "Plataforma é obrigatória."),
    date: z.string().min(1, "Data é obrigatória."),
    wishlists: z.coerce.number().min(0, "Wishlists devem ser >= 0."),
    sales: z.coerce.number().min(0, "Vendas devem ser >= 0."),
    cost: z.coerce.number().min(0, "Custo deve ser >= 0."),
    
    // New fields for detailed event tracking
    startDate: z.string().min(1, "Data de Início é obrigatória."),
    endDate: z.string().min(1, "Data de Fim é obrigatória."),
    action: z.string().optional(),
    views: z.coerce.number().min(0, "Views devem ser >= 0."),
    wlGenerated: z.coerce.number().min(0, "WLs Gerados devem ser >= 0."),
});

// --- Component ---

interface EditEventFormProps {
    games: GameMetrics[];
    entry: EventTrackingEntry;
    onSave: (updatedEntry: EventTrackingEntry) => void;
    onClose: () => void;
}

const EditEventForm: React.FC<EditEventFormProps> = ({ games, entry, onSave, onClose }) => {
    const defaultStartDate = entry.startDate ? entry.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const defaultEndDate = entry.endDate ? entry.endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const form = useForm<z.infer<typeof EditEventFormSchema>>({
        resolver: zodResolver(EditEventFormSchema),
        defaultValues: {
            game: entry.game,
            event: entry.event,
            platform: entry.platform,
            date: entry.date.toISOString().substring(0, 10),
            wishlists: entry.wishlists,
            sales: entry.sales,
            cost: entry.cost,
            // Default values for new fields
            startDate: defaultStartDate,
            endDate: defaultEndDate,
            action: entry.action || '',
            views: entry.views || 0,
            wlGenerated: entry.wlGenerated || 0,
        },
    });

    const onSubmit = (values: z.infer<typeof EditEventFormSchema>) => {
        const updatedEntry: EventTrackingEntry = {
            ...entry,
            game: values.game,
            event: values.event,
            platform: values.platform as Platform,
            date: new Date(values.date),
            wishlists: values.wishlists,
            sales: values.sales,
            cost: values.cost,
            // Updated detailed fields
            startDate: new Date(values.startDate),
            endDate: new Date(values.endDate),
            action: values.action || '',
            views: values.views,
            wlGenerated: values.wlGenerated,
        };

        onSave(updatedEntry);
        onClose();
        toast.success("Entrada de Evento atualizada.");
    };

    // ... (rest of the form rendering logic)
    // Calculating derived metrics for display (ROI, Cost per View)
    const views = form.watch('views') || 0;
    const cost = form.watch('cost') || 0;
    const sales = form.watch('sales') || 0;

    const roi = sales > 0 && cost > 0 ? ((sales * 10) - cost) / cost : 0; // Assuming $10 revenue per sale for ROI calculation
    const costPerView = views > 0 ? cost / views : 0;

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
                    name="event"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Evento</FormLabel>
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
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data de Registro (Para Dashboard)</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="views"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Visualizações</FormLabel>
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
                    <FormField
                        control={form.control}
                        name="wlGenerated"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>WLs Gerados (Estimativa)</FormLabel>
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
                </div>
                <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ação/Observação</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium">ROI Estimado:</p>
                        <p className="text-lg font-bold text-gogo-green">{roi.toFixed(2)}x</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium">Custo por View:</p>
                        <p className="text-lg font-bold">{formatCurrency(costPerView, 'BRL')}</p>
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

export default EditEventForm;