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
import { Calculator, TrendingUp, DollarSign, MessageSquare, Gauge } from 'lucide-react';
import KpiCard from '../dashboard/KpiCard';
import { GameOption } from '@/integrations/supabase/functions';

// --- Interfaces e Tipos ---

// Tabela de Multiplicadores NB (Simon Carless)
const NB_MULTIPLIERS = [
    { label: 'Antes de 2017 (60-70)', min: 60, max: 70, default: 65 },
    { label: '2019 - 2022 (30-40)', min: 30, max: 40, default: 35 },
    { label: '2023 - 2025 (30-35)', min: 30, max: 35, default: 32 },
    { label: 'Viral (20-25)', min: 20, max: 25, default: 22 },
];

// Tabela de Multiplicadores CCU
const CCU_MULTIPLIERS = [
    { label: 'Padrão (20-25)', min: 20, max: 25, default: 22 },
    { label: 'Hype Alto (10-15)', min: 10, max: 15, default: 12 },
    { label: 'Viral Orgânico (40+)', min: 40, max: 50, default: 45 },
];

// Estrutura de dados para o jogo estimado (compatível com GameOption)
export interface EstimatedGame extends GameOption {
    estimatedSales: number;
    estimatedRevenue: number;
    estimationMethod: string;
}

// Schema de validação
const formSchema = z.object({
    reviews: z.number().min(0, "Reviews deve ser um número positivo.").default(0),
    priceBRL: z.number().min(0.01, "Preço deve ser maior que zero.").default(30.00),
    discountFactor: z.number().min(0.01).max(1.0, "Fator de desconto deve ser entre 0.01 e 1.0.").default(0.60), // 60% a 70%
    ccuPeak: z.number().min(0).default(0),
    nbMultiplier: z.number().min(1).default(NB_MULTIPLIERS[2].default),
    ccuMultiplier: z.number().min(1).default(CCU_MULTIPLIERS[0].default),
});

type EstimatorFormValues = z.infer<typeof formSchema>;

interface GameEstimatorProps {
    gameName: string;
    onEstimate: (game: EstimatedGame) => void;
    onClose: () => void;
}

const GameEstimator: React.FC<GameEstimatorProps> = ({ gameName, onEstimate, onClose }) => {
    const form = useForm<EstimatorFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reviews: 1000,
            priceBRL: 30.00,
            discountFactor: 0.60,
            ccuPeak: 0,
            nbMultiplier: NB_MULTIPLIERS[2].default,
            ccuMultiplier: CCU_MULTIPLIERS[0].default,
        },
    });

    const values = form.watch();

    const calculations = useMemo(() => {
        const { reviews, priceBRL, discountFactor, ccuPeak, nbMultiplier, ccuMultiplier } = values;
        
        const results: { method: string, sales: number, revenue: number }[] = [];

        // 1. Método Boxleiter Ajustado (M=30, padrão simplificado)
        const salesBoxleiter = reviews * 30;
        const revenueBoxleiter = salesBoxleiter * priceBRL * discountFactor;
        results.push({ method: 'Boxleiter Ajustado (M=30)', sales: salesBoxleiter, revenue: revenueBoxleiter });

        // 2. Método Simon Carless (NB)
        const salesCarless = reviews * nbMultiplier;
        const revenueCarless = salesCarless * priceBRL * discountFactor;
        results.push({ method: `Simon Carless (NB=${nbMultiplier})`, sales: salesCarless, revenue: revenueCarless });

        // 3. Método CCU (Se CCU > 0)
        if (ccuPeak > 0) {
            const salesCCU = ccuPeak * ccuMultiplier;
            const revenueCCU = salesCCU * priceBRL * discountFactor;
            results.push({ method: `CCU (M=${ccuMultiplier})`, sales: salesCCU, revenue: revenueCCU });
        }

        // 4. Fórmula Simplificada de Receita (Reviews * 30)
        const salesSimplified = reviews * 30;
        const revenueSimplified = salesSimplified * priceBRL * discountFactor;
        results.push({ method: 'Receita Simplificada (Reviews * 30)', sales: salesSimplified, revenue: revenueSimplified });

        // Análise Combinada
        const totalSales = results.reduce((sum, r) => sum + r.sales, 0);
        const totalRevenue = results.reduce((sum, r) => sum + r.revenue, 0);
        const count = results.length;

        const avgSales = count > 0 ? totalSales / count : 0;
        const avgRevenue = count > 0 ? totalRevenue / count : 0;

        return {
            results,
            avgSales,
            avgRevenue,
        };
    }, [values]);

    const handleSelectAverage = () => {
        const avgGame: EstimatedGame = {
            name: `${gameName} (Estimativa Média)`,
            launchDate: null,
            suggestedPrice: values.priceBRL,
            priceUSD: null,
            reviewCount: values.reviews,
            reviewSummary: 'Estimativa',
            developer: null,
            publisher: null,
            capsuleImageUrl: null,
            source: 'Fórmulas de Estimativa',
            estimatedSales: calculations.avgSales,
            estimatedRevenue: calculations.avgRevenue,
            estimationMethod: 'Média Combinada',
        };
        onEstimate(avgGame);
    };

    return (
        <Card className="border-none shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center text-gogo-orange">
                    <Calculator className="h-5 w-5 mr-2" /> Estimativa de Vendas para {gameName}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="reviews"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reviews Totais (Steam)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="1000" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="priceBRL"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preço Base (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="30.00" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="discountFactor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fator de Receita Líquida (0.60 = 60%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.60" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nbMultiplier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Multiplicador NB (Simon Carless)</FormLabel>
                                        <Select onValueChange={val => field.onChange(Number(val))} defaultValue={String(field.value)}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o Multiplicador" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {NB_MULTIPLIERS.map(m => (
                                                    <SelectItem key={m.label} value={String(m.default)}>{m.label} (Padrão: {m.default})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ccuPeak"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pico CCU (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {values.ccuPeak > 0 && (
                            <FormField
                                control={form.control}
                                name="ccuMultiplier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Multiplicador CCU</FormLabel>
                                        <Select onValueChange={val => field.onChange(Number(val))} defaultValue={String(field.value)}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o Multiplicador CCU" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {CCU_MULTIPLIERS.map(m => (
                                                    <SelectItem key={m.label} value={String(m.default)}>{m.label} (Padrão: {m.default})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </form>
                </Form>

                <Separator />

                {/* Resultados da Estimativa */}
                <h4 className="text-lg font-semibold text-gogo-cyan flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" /> Resultados por Método
                </h4>
                <div className="space-y-3">
                    {calculations.results.map((res, index) => (
                        <Card key={index} className="p-3 border-l-4 border-gogo-orange/50">
                            <CardTitle className="text-sm font-bold mb-1">{res.method}</CardTitle>
                            <div className="flex justify-between text-sm">
                                <p className="text-muted-foreground flex items-center"><List className="h-3 w-3 mr-1" /> Vendas Estimadas:</p>
                                <p className="font-medium text-gogo-cyan">{formatNumber(res.sales)}</p>
                            </div>
                            <div className="flex justify-between text-sm">
                                <p className="text-muted-foreground flex items-center"><DollarSign className="h-3 w-3 mr-1" /> Receita Líquida Estimada:</p>
                                <p className="font-medium text-gogo-orange">{formatCurrency(res.revenue)}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                <Separator />

                {/* Média Combinada */}
                <Card className="p-4 bg-gogo-cyan/10 border-2 border-gogo-cyan shadow-gogo-cyan-glow/30">
                    <CardTitle className="text-xl font-bold mb-2 flex items-center text-gogo-cyan">
                        <Gauge className="h-5 w-5 mr-2" /> Média Combinada
                    </CardTitle>
                    <div className="grid grid-cols-2 gap-4">
                        <KpiCard 
                            title="Média de Vendas Estimadas" 
                            value={formatNumber(calculations.avgSales)} 
                            icon={<List className="h-4 w-4 text-gogo-cyan" />}
                        />
                        <KpiCard 
                            title="Média de Receita Líquida Estimada" 
                            value={formatCurrency(calculations.avgRevenue)} 
                            icon={<DollarSign className="h-4 w-4 text-gogo-orange" />}
                        />
                    </div>
                    <Button 
                        onClick={handleSelectAverage} 
                        className="w-full mt-4 bg-gogo-orange hover:bg-gogo-orange/90"
                        disabled={calculations.avgSales === 0}
                    >
                        Selecionar Média para Comparação (Jogo 2)
                    </Button>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default GameEstimator;