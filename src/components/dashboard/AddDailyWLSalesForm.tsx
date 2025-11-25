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

// Definindo o tipo de plataforma
const PlatformEnum = z.enum(['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Android', 'iOS', 'Epic Games', 'Outra']);

// Schema de validação: Agora aceita a variação diária
const formSchema = z.object({
    platform: PlatformEnum.default('Steam'),
    date: z.string().min(1, "A data é obrigatória (formato YYYY-MM-DD)."),
    dailyVariation: z.number({ invalid_type_error: "Variação deve ser um número." }).default(0), // Novo campo para WL Ganhas/Perdidas
    sales: z.number().min(0, "Vendas deve ser um número positivo.").default(0),
});

type DailyWLSalesFormValues = z.infer<typeof formSchema>;

interface AddDailyWLSalesFormProps {
    gameName: string;
    wlSalesData: WLSalesPlatformEntry[];
    onSave: (data: Omit<DailyWLSalesFormValues, 'dailyVariation'> & { wishlists: number, variation: number }) => void;
    onClose: () => void;
}

const AddDailyWLSalesForm: React.FC<AddDailyWLSalesFormProps> = ({ gameName, wlSalesData, onSave, onClose }) => {
    
    // Função para obter a última WL registrada e a próxima data sugerida
    const getLatestData = (currentPlatform: Platform) => {
        const platformData = wlSalesData
            .filter(e => e.platform === currentPlatform)
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
        resolver: zodResolver(formSchema),
        defaultValues: {
            platform: currentPlatform,
            date: nextDate,
            dailyVariation: 0,
            sales: 0,
        },
    });
    
    // Atualiza os valores padrão quando a plataforma muda
    React.useEffect(() => {
        const { nextDate: newNextDate, lastWL: newLastWL } = getLatestData(currentPlatform);
        form.reset({
            platform: currentPlatform,
            date: newNextDate,
            dailyVariation: 0,
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
        
        // 2. Cálculo da WL Total na Data
        const newTotalWL = lastWL + values.dailyVariation;
        
        // 3. Validação de WL Total (apenas se for o primeiro registro, ou se a WL total for negativa)
        if (newTotalWL < 0) {
            form.setError('dailyVariation', { message: `A WL total resultante (${formatNumber(newTotalWL)}) não pode ser negativa.` });
            return;
        }
        
        // 4. Se a data for retroativa, a WL Total será calculada com base na última WL registrada,
        // mas o Dashboard recalculará a variação de todos os dias subsequentes.
        
        onSave({
            platform: values.platform,
            date: values.date,
            sales: values.sales,
            wishlists: newTotalWL, // Salva o total calculado
            variation: values.dailyVariation, // Salva a variação inserida
        }); 
    };

    const dailyVariation = form.watch('dailyVariation');
    const newTotalWL = lastWL + dailyVariation;

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
                        <Label className="text-muted-foreground">WL Total Calculada</Label>
                        <Input 
                            value={formatNumber(newTotalWL)} 
                            disabled 
                            className={`font-bold ${newTotalWL >= lastWL ? 'text-green-500' : 'text-red-500'} bg-muted`} 
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="dailyVariation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center">
                                <TrendingUp className="h-4 w-4 mr-2" /> Variação Diária WL (Ganhas/Perdidas)
                            </FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    placeholder="Ex: 500" 
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