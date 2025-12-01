"use client";

import React, { useState, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Calculator, TrendingUp, DollarSign, MessageSquare, Gauge, List, Info, CheckSquare, Clock, BookOpen, Bot } from 'lucide-react'; 
import KpiCard from '../dashboard/KpiCard'; 
import { GameOption } from '@/integrations/supabase/games';
import { TrackingData } from '@/data/trackingData';
import { toast } from 'sonner';

// Tipagem para o jogo estimado (EXPORTADO)
export interface EstimatedGame extends GameOption {
    estimatedSales: number;
    estimatedRevenue: number;
    estimationMethod: string;
    timeframe: string;
}

// Schema de validação para o estimador
const estimationSchema = z.object({
    baseGameName: z.string().min(1, "Selecione um jogo base."),
    targetGameName: z.string().min(1, "Defina o nome do jogo alvo."),
    targetPrice: z.number().min(0.01, "O preço deve ser maior que zero."),
    targetCategory: z.string().min(1, "Defina a categoria alvo."),
    wlConversionRate: z.number().min(0).max(1, "A taxa deve estar entre 0 e 1."),
    targetWishlists: z.number().min(100, "O número de wishlists deve ser realista."),
    timeframe: z.enum(['3 months', '6 months', '1 year', 'total']),
});

type EstimationFormValues = z.infer<typeof estimationSchema>;

interface GameEstimatorProps {
    allGames: GameOption[];
    onApplyEstimation: (estimation: EstimatedGame) => void;
    localTrackingData: TrackingData;
}

const GameEstimator: React.FC<GameEstimatorProps> = ({ allGames, onApplyEstimation, localTrackingData }) => {
    const [baseGameData, setBaseGameData] = useState<GameOption | null>(null);

    const form = useForm<EstimationFormValues>({
        resolver: zodResolver(estimationSchema),
        defaultValues: {
            baseGameName: allGames[0]?.name || '',
            targetGameName: 'Novo Jogo Estimado',
            targetPrice: 19.99,
            targetCategory: 'Ação',
            wlConversionRate: 0.15, // 15%
            targetWishlists: 50000,
            timeframe: '1 year',
        },
    });

    const handleBaseGameChange = (name: string) => {
        const game = allGames.find(g => g.name === name);
        setBaseGameData(game || null);
        if (game) {
            form.setValue('targetPrice', game.suggested_price || 19.99);
            form.setValue('targetCategory', game.category || 'Ação');
        }
    };

    const baseGameSalesData = useMemo(() => {
        if (!baseGameData) return null;
        const sales = localTrackingData.wlSales.filter(e => e.game === baseGameData.name);
        const totalSales = sales.reduce((sum, item) => sum + item.sales, 0);
        const totalWishlists = sales.length > 0 ? sales[sales.length - 1].wishlists : 0;
        
        // Calcula a taxa de conversão WL-to-Sales real (se houver dados)
        const resultSummary = localTrackingData.resultSummary.find(r => r.game === baseGameData.name && r['Conversão vendas/wl']);
        const realConversionRate = Number(resultSummary?.['Conversão vendas/wl']) || 0;

        return { totalSales, totalWishlists, realConversionRate };
    }, [baseGameData, localTrackingData]);

    const onSubmit = (values: EstimationFormValues) => {
        if (!baseGameData) {
            toast.error("Selecione um jogo base válido.");
            return;
        }

        // 1. Calcular vendas estimadas
        const estimatedSales = values.targetWishlists * values.wlConversionRate;
        const estimatedRevenue = estimatedSales * values.targetPrice;

        const estimation: EstimatedGame = {
            id: `est-${Date.now()}`,
            name: values.targetGameName,
            launch_date: null,
            suggested_price: values.targetPrice,
            capsule_image_url: baseGameData.capsule_image_url, // Usa a imagem do jogo base
            category: values.targetCategory,
            estimatedSales: Math.round(estimatedSales),
            estimatedRevenue: estimatedRevenue,
            estimationMethod: `Baseado em ${baseGameData.name}`,
            timeframe: values.timeframe,
        };

        onApplyEstimation(estimation);
    };

    const currentValues = form.watch();
    const estimatedSales = currentValues.targetWishlists * currentValues.wlConversionRate;
    const estimatedRevenue = estimatedSales * currentValues.targetPrice;

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center text-gogo-cyan">
                    <Bot className="h-6 w-6 mr-2" /> Estimador de Vendas (WL-to-Sales)
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Coluna 1: Configuração */}
                <div className="space-y-4 lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gogo-orange">Configuração da Estimativa</h3>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="baseGameName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jogo Base (Modelo)</FormLabel>
                                        <Select onValueChange={(name) => { field.onChange(name); handleBaseGameChange(name); }} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o jogo base" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {allGames.map(game => (
                                                    <SelectItem key={game.id} value={game.name}>{game.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="targetGameName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Jogo Alvo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome do Novo Jogo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="targetPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preço Alvo (USD)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                step="0.01"
                                                placeholder="19.99" 
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
                                name="targetCategory"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoria Alvo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ação, RPG, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="targetWishlists"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Wishlists Alvo (Lançamento)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="50000" 
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
                                name="wlConversionRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Taxa de Conversão WL-to-Sales (0.0 - 1.0)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                step="0.01"
                                                placeholder="0.15" 
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
                                name="timeframe"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Período de Vendas</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o período" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="3 months">3 Meses</SelectItem>
                                                <SelectItem value="6 months">6 Meses</SelectItem>
                                                <SelectItem value="1 year">1 Ano</SelectItem>
                                                <SelectItem value="total">Total</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full bg-gogo-cyan hover:bg-gogo-cyan/90">
                                <Calculator className="h-4 w-4 mr-2" /> Aplicar Estimativa ao Jogo 2
                            </Button>
                        </form>
                    </Form>
                </div>

                {/* Coluna 2: Dados do Jogo Base */}
                <div className="space-y-4 lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gogo-orange">Dados do Jogo Base ({baseGameData?.name || 'N/A'})</h3>
                    {baseGameData && baseGameSalesData ? (
                        <div className="space-y-4">
                            <KpiCard
                                title="WL Total (Base)"
                                value={formatNumber(baseGameSalesData.totalWishlists)}
                                description="Último registro de WL"
                                icon={<List className="h-4 w-4 text-gogo-cyan" />}
                            />
                            <KpiCard
                                title="Vendas Totais (Base)"
                                value={formatNumber(baseGameSalesData.totalSales)}
                                description="Unidades vendidas"
                                icon={<DollarSign className="h-4 w-4 text-gogo-orange" />}
                            />
                            <KpiCard
                                title="Conversão WL-to-Sales (Real)"
                                value={`${(baseGameSalesData.realConversionRate * 100).toFixed(2)}%`}
                                description="Taxa de conversão real registrada"
                                icon={<Gauge className="h-4 w-4 text-green-500" />}
                            />
                            <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                <p className="text-sm font-medium flex items-center text-muted-foreground">
                                    <Info className="h-4 w-4 mr-2" /> Sugestão
                                </p>
                                <p className="text-sm mt-1">
                                    Use a taxa de conversão real ({baseGameSalesData.realConversionRate.toFixed(2)}) como ponto de partida para a estimativa.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Selecione um jogo base para ver os dados reais.</p>
                    )}
                </div>

                {/* Coluna 3: Resultados da Estimativa */}
                <div className="space-y-4 lg:col-span-1">
                    <h3 className="text-lg font-semibold text-gogo-orange">Resultado da Estimativa</h3>
                    <KpiCard
                        title="Vendas Estimadas"
                        value={formatNumber(estimatedSales)} // Removido o segundo argumento '0'
                        description={`Unidades estimadas em ${currentValues.timeframe}`}
                        icon={<TrendingUp className="h-4 w-4 text-gogo-cyan" />}
                    />
                    <KpiCard
                        title="Receita Estimada (Bruta)"
                        value={formatCurrency(estimatedRevenue)}
                        description={`Baseado em ${formatCurrency(currentValues.targetPrice)}`}
                        icon={<DollarSign className="h-4 w-4 text-green-500" />}
                    />
                    <div className="p-4 bg-gogo-cyan/10 rounded-lg border border-gogo-cyan/30">
                        <p className="text-sm font-medium flex items-center text-gogo-cyan">
                            <BookOpen className="h-4 w-4 mr-2" /> Fórmula
                        </p>
                        <p className="text-sm mt-1 text-muted-foreground">
                            Vendas = WL Alvo ({formatNumber(currentValues.targetWishlists)}) * Taxa de Conversão ({(currentValues.wlConversionRate * 100).toFixed(1)}%)
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GameEstimator;