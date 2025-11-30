import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { InfluencerTrackingEntry, Platform, GameMetrics } from '@/data/trackingData';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

// --- Schema ---

const EditInfluencerFormSchema = z.object({
    game: z.string().min(1, "Jogo é obrigatório."),
    influencer: z.string().min(1, "Nome do Influencer é obrigatório."),
    platform: z.string().min(1, "Plataforma é obrigatória."),
    date: z.string().min(1, "Data é obrigatória."),
    views: z.coerce.number().min(0, "Views devem ser >= 0."),
    wishlists: z.coerce.number().min(0, "Wishlists devem ser >= 0."),
    sales: z.coerce.number().min(0, "Vendas devem ser >= 0."),
    cost: z.coerce.number().min(0, "Custo deve ser >= 0."),

    // New fields for detailed influencer tracking
    action: z.string().optional(),
    contentType: z.string().optional(),
    investment: z.coerce.number().min(0, "Investimento deve ser >= 0."),
    estimatedWL: z.coerce.number().min(0, "WLs Estimados devem ser >= 0."),
    observations: z.string().optional(),
});

// --- Component ---

interface EditInfluencerFormProps {
    games: GameMetrics[];
    entry: InfluencerTrackingEntry;
    onSave: (updatedEntry: InfluencerTrackingEntry) => void;
    onClose: () => void;
}

const EditInfluencerForm: React.FC<EditInfluencerFormProps> = ({ games, entry, onSave, onClose }) => {
    const form = useForm<z.infer<typeof EditInfluencerFormSchema>>({
        resolver: zodResolver(EditInfluencerFormSchema),
        defaultValues: {
            game: entry.game,
            influencer: entry.influencer,
            platform: entry.platform,
            date: entry.date.toISOString().substring(0, 10),
            views: entry.views,
            wishlists: entry.wishlists,
            sales: entry.sales,
            cost: entry.cost,
            // Default values for new fields
            action: entry.action || '',
            contentType: entry.contentType || '',
            investment: entry.investment || 0,
            estimatedWL: entry.estimatedWL || 0,
            observations: entry.observations || '',
        },
    });

    const onSubmit = (values: z.infer<typeof EditInfluencerFormSchema>) => {
        const updatedEntry: InfluencerTrackingEntry = {
            ...entry,
            game: values.game,
            influencer: values.influencer,
            platform: values.platform as Platform,
            date: new Date(values.date),
            views: values.views,
            wishlists: values.wishlists,
            sales: values.sales,
            cost: values.cost,
            // Updated detailed fields
            action: values.action || '',
            contentType: values.contentType || '',
            investment: values.investment,
            estimatedWL: values.estimatedWL,
            observations: values.observations || '',
        };

        onSave(updatedEntry);
        onClose();
        toast.success("Entrada de Influencer atualizada.");
    };

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
                    name="influencer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Influencer</FormLabel>
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
                        name="estimatedWL"
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
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                    <FormField
                        control={form.control}
                        name="investment"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Investimento (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="contentType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Conteúdo</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="action"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ação/CTA</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                                <Textarea {...field} />
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

export default EditInfluencerForm;