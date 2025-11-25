"use client";

import React, { useMemo } from 'react';
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
import { WLSalesPlatformEntry, Platform } from '@/data/trackingData';
import { addDays, startOfDay } from 'date-fns';
import { List, Calendar, DollarSign } from 'lucide-react';

// Definindo o tipo de plataforma
const PlatformEnum = z.enum(['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Android', 'iOS', 'Epic Games', 'Outra']);

// Schema de validação
const formSchema = z.object({
    platform: PlatformEnum.default('Steam'),
    date: z.string().min(1, "A data é obrigatória (formato YYYY-MM-DD)."),
    wishlists: z.number().min(0, "Wishlists deve ser um número positivo."),
    sales: z.number().min(0, "Vendas deve ser um número positivo.").default(0),
});

type DailyWLSalesFormValues = z.infer<typeof formSchema>;

interface AddDailyWLSalesFormProps {
    gameName: string;
    wlSalesData: WLSalesPlatformEntry[];
    onSave: (data: DailyWLSalesFormValues) => void;
    onClose: () => void;
}

const AddDailyWLSalesForm: React.FC<AddDailyWLSalesFormProps> = ({ gameName, wlSalesData, onSave, onClose }) => {
    
    // 1. Calcular a próxima data e a última WL registrada
    const getLatestData = (currentPlatform: Platform) => {
        const platformData = wlSalesData
            .filter(e => e.platform === currentPlatform)
            .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
        
        const lastEntry = platformData.length > 0 ? platformData[platformData.length - 1] : null;
        
        let nextDate = new Date();
        let lastWL = 0;

        if (lastEntry && lastEntry.date) {
            // Próxima data é o dia seguinte ao último registro
            nextDate = addDays(startOfDay(lastEntry.date), 1);
            lastWL = lastEntry.wishlists;
        }
        
        // Se a próxima data for anterior a hoje, usa hoje
        if (startOfDay(nextDate).getTime() < startOfDay(new Date()).getTime()) {
             nextDate = new Date();
        }

        return {
            nextDate: nextDate.toISOString().split('T')[0],
            lastWL,
        };
    };

    const [currentPlatform, setCurrentPlatform] = useState<Platform>('Steam');
    const { nextDate, lastWL } = useMemo(() => getLatestData(currentPlatform), [currentPlatform, wlSalesData]);

    const form = useForm<DailyWLSalesFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            platform: currentPlatform,
            date: nextDate,
            wishlists: lastWL, // Preenche com a última WL registrada
            sales: 0,
        },
    });
    
    // Atualiza os valores padrão quando a plataforma muda
    React.useEffect(() => {
        const { nextDate: newNextDate, lastWL: newLastWL } = getLatestData(currentPlatform);
        form.reset({
            platform: currentPlatform,
            date: newNextDate,
            wishlists: newLastWL,
            sales: 0,
        });
    }, [currentPlatform, wlSalesData]);


    const onSubmit = (values: DailyWLSalesFormValues) => {
        // Validação extra: a nova WL deve ser maior ou igual à última WL
        if (values.wishlists < lastWL) {
            form.setError('wishlists', { message: `A WL total deve ser maior ou igual à última WL registrada (${lastWL}).` });
            return;
        }
        
        onSave(values); 
    };

    const currentWL = form.watch('wishlists');
    const variation = currentWL - lastWL;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold text-gogo-cyan">Jogo: {gameName}</h3>
                
                <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Plataforma</FormLabel>
                            <Select onValueChange={(value: Platform) => { field.onChange(value); setCurrentPlatform(value); }} defaultValue={field.value}>
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
                            <FormLabel className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" /> Data da Entrada (Próxima Sugerida)
                            </FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">WL Anterior</Label>
                        <Input value={formatNumber(lastWL)} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Variação Diária</Label>
                        <Input 
                            value={formatNumber(variation)} 
                            disabled 
                            className={`font-bold ${variation >= 0 ? 'text-green-500' : 'text-red-500'} bg-muted`} 
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="wishlists"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center">
                                <List className="h-4 w-4 mr-2" /> Wishlists Totais na Data
                            </FormLabel>
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
                            <FormLabel className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-2" /> Vendas Diárias (Unidades)
                            </FormLabel>
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

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" className="bg-gogo-orange hover:bg-gogo-orange/90">
                        Salvar Entrada Rápida
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default AddDailyWLSalesForm;