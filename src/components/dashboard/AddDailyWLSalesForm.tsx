"use client";

import React, { useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { WLSalesPlatformEntry, Platform } from '@/data/trackingData';
import { addDays, startOfDay, isBefore, isEqual } from 'date-fns';
import { List, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

// Definindo o tipo de plataforma (Atualizado)
const PlatformEnum = z.enum(['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Android', 'iOS', 'Epic Games', 'Outra']);

// Schema de validação: Agora aceita a WL Total
export const DailyWLSalesFormSchema = z.object({ // Exportando o schema
    platform: PlatformEnum.default('Steam'),
    date: z.string().min(1, "A data é obrigatória (formato YYYY-MM-DD)."),
    wishlists: z.number().min(0, "Wishlists deve ser um número positivo."), // WL Total na Data
    sales: z.number().min(0, "Vendas deve ser um número positivo.").default(0),
});

type DailyWLSalesFormValues = z.infer<typeof DailyWLSalesFormSchema>;

interface AddDailyWLSalesFormProps {
    gameName: string;
    wlSalesData: WLSalesPlatformEntry[];
    onSave: (data: DailyWLSalesFormValues) => void;
    onClose: () => void;
}

const AddDailyWLSalesForm: React.FC<AddDailyWLSalesFormProps> = ({ gameName, wlSalesData, onSave, onClose }) => {
    
    // Função para obter a última WL registrada e a próxima data sugerida
    const getLatestData = (currentPlatform: Platform) => {
        // Agora, a plataforma efetiva é a plataforma selecionada, pois as categorias foram removidas
        const effectivePlatform = currentPlatform;

        const platformData = wlSalesData
            .filter(e => e.platform === effectivePlatform)
            .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
        
        const lastEntry = platformData.length > 0 ? platformData[platformData.length - 1] : null;
        
        let nextDate = new Date();
        let lastWL = 0;

        if (lastEntry && lastEntry.date) {
            lastWL = lastEntry.wishlists;
            nextDate = addDays(startOfDay(lastEntry.date), 1);
        }
        
        // Se a próxima data for anterior a hoje, usa hoje como default, a menos que não haja dados.
        if (platformData.length > 0 && isBefore(startOfDay(nextDate), startOfDay(new Date()))) {
             nextDate = new Date();
        }

        return {
            nextDate: startOfDay(nextDate).toISOString().split('T')[0],
            lastWL,
            lastEntryDate: lastEntry?.date ? startOfDay(lastEntry.date) : null,
        };
    };

    const [currentPlatform, setCurrentPlatform] = useState<Platform>('Steam');
    const { nextDate, lastWL, lastEntryDate } = useMemo(() => getLatestData(currentPlatform), [currentPlatform, wlSalesData]);

    const form = useForm<DailyWLSalesFormValues>({
        resolver: zodResolver(DailyWLSalesFormSchema),
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
        const entryDate = startOfDay(new Date(values.date));
        
        // 1. Validação de data: Se houver um último registro, a nova data não pode ser igual a ele.
        if (lastEntryDate && isEqual(entryDate, lastEntryDate)) {
            toast.error(`Já existe um registro para ${values.platform} na data ${values.date}. Use o modo de edição.`);
            return;
        }
        
        // 2. Validação de WL: Se a WL total for negativa (impedido pelo schema, mas checagem extra)
        if (values.wishlists < 0) {
            form.setError('wishlists', { message: `A WL total não pode ser negativa.` });
            return;
        }
        
        // O Dashboard (parent component) é responsável por recalcular a variação (variation)
        // de todos os dias subsequentes se esta for uma entrada retroativa.
        
        onSave(values); 
    };

    const currentWL = form.watch('wishlists');
    
    // Cálculo da variação para exibição
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
                                <Calendar className="h-4 w-4 mr-2" /> Data da Entrada
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
                        <Label className="text-muted-foreground">WL Anterior (Último Reg.)</Label>
                        <Input value={formatNumber(lastWL)} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center text-muted-foreground">
                            <TrendingUp className="h-4 w-4 mr-2" /> Variação WL (Calculada)
                        </Label>
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
                                    placeholder={formatNumber(lastWL)} 
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