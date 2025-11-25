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
import { Calculator, TrendingUp, DollarSign, MessageSquare, Gauge, List, Info, Checkbox } from 'lucide-react';
import KpiCard from '../dashboard/KpiCard';
import { GameOption } from '@/integrations/supabase/functions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// --- Constantes e Multiplicadores ---

const MOCK_CATEGORIES = ['Ação', 'Terror', 'RPG', 'Estratégia', 'Simulação', 'Aventura', 'Visual Novel', 'Casual', 'Outro'];

// Multiplicadores Simon Carless (NB)
const NB_MULTIPLIERS = [
    { label: 'Antes de 2017 (65)', value: 65 },
    { label: '2019 - 2022 (35)', value: 35 },
    { label: '2023 - 2025 (32)', value: 32 },
    { label: 'Viral (22)', value: 22 },
];

// Multiplicadores CCU (SteamDB)
const CCU_MULTIPLIERS = [
    { label: 'Multiplayer/Coop (40)', value: 40, genre: 'Multiplayer' },
    { label: 'Singleplayer (100)', value: 100, genre: 'Singleplayer' },
];

// Multiplicadores VG Insights (Gênero)
const VG_INSIGHTS_MULTIPLIERS: Record<string, number> = {
    'Terror': 30,
    'RPG': 30,
    'Estratégia': 30,
    'Simulação': 55,
    'Casual': 55,
    'Visual Novel': 40,
    'Ação': 35, // Defaulting Action to NB 2023-2025 standard
    'Aventura': 35,
    'Outro': 35,
};

// --- Interfaces e Tipos ---

export interface EstimatedGame extends GameOption {
    estimatedSales: number;
    estimatedRevenue: number;
    estimationMethod: string;
}

type EstimationMethod = 'boxleiter' | 'carless' | 'gamalytic' | 'vginsights' | 'ccu' | 'revenue';

// Schema de validação
const formSchema = z.object({
    reviews: z.number().min(0, "Reviews deve ser um número positivo.").default(0),
    priceBRL: z.number().min(0.01, "Preço deve ser maior que zero.").default(30.00),
    discountFactor: z.number().min(0.01).max(1.0, "Fator de desconto deve ser entre 0.01 e 1.0.").default(0.65), // 65%
    ccuPeak: z.number().min(0).default(0),
    nbMultiplier: z.number().min(1).default(NB_MULTIPLIERS[2].value),
    ccuMultiplier: z.number().min(1).default(CCU_MULTIPLIERS[1].value), // Default Singleplayer
    category: z.string().min(1, "O gênero é obrigatório.").default('Ação'),
    methodsToCombine: z.array(z.string()).default(['boxleiter', 'carless', 'gamalytic', 'vginsights', 'revenue']),
});

type EstimatorFormValues = z.infer<typeof formSchema>;

interface GameEstimatorProps {
    gameName: string;
    initialPrice?: number;
    initialCategory?: string | null;
    onEstimate: (game: EstimatedGame) => void;
    onClose: () => void;
}

const GameEstimator: React.FC<GameEstimatorProps> = ({ gameName, initialPrice = 30.00, initialCategory = 'Ação', onEstimate, onClose }) => {
    const form = useForm<EstimatorFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reviews: 1000,
            priceBRL: initialPrice,
            discountFactor: 0.65,
            ccuPeak: 0,
            nbMultiplier: NB_MULTIPLIERS[2].value,
            ccuMultiplier: CCU_MULTIPLIERS[1].value,
            category: initialCategory || 'Ação',
            methodsToCombine: ['boxleiter', 'carless', 'gamalytic', 'vginsights', 'revenue'],
        },
    });

    const values = form.watch();

    const calculateMethod = (method: EstimationMethod, reviews: number, priceBRL: number, discountFactor: number, ccuPeak: number, nbMultiplier: number, category: string): { sales: number, revenue: number, method: string } | null => {
        const priceUSD = priceBRL / 5; // Simplificação da conversão BRL -> USD

        switch (method) {
            case 'boxleiter': {
                const sales = reviews * 30;
                const revenue = sales * priceBRL * discountFactor;
                return { method: 'Boxleiter Ajustado (M=30)', sales, revenue };
            }
            case 'carless': {
                const sales = reviews * nbMultiplier;
                const revenue = sales * priceBRL * discountFactor;
                return { method: `Simon Carless (NB=${nbMultiplier})`, sales, revenue };
            }
            case 'gamalytic': {
                let multiplier = 35; // Default
                // Usando R$ 25 (USD 5), R$ 100 (USD 20) como thresholds
                if (priceBRL < 25) {
                    multiplier = 20;
                } else if (priceBRL > 100) {
                    multiplier = 50;
                } else {
                    multiplier = 35;
                }
                const sales = reviews * multiplier;
                const revenue = sales * priceBRL * discountFactor;
                return { method: `Gamalytic (M=${multiplier})`, sales, revenue };
            }
            case 'vginsights': {
                const multiplier = VG_INSIGHTS_MULTIPLIERS[category] || 35;
                const sales = reviews * multiplier;
                const revenue = sales * priceBRL * discountFactor;
                return { method: `VG Insights (M=${multiplier})`, sales, revenue };
            }
            case 'ccu': {
                if (ccuPeak === 0) return null;
                const multiplier = values.ccuMultiplier;
                const sales = ccuPeak * multiplier;
                const revenue = sales * priceBRL * discountFactor;
                return { method: `SteamDB CCU (M=${multiplier})`, sales, revenue };
            }
            case 'revenue': {
                // Método da Receita (Reviews * 30) * Preço * 0.65
                const sales = reviews * 30; // Usamos 30 como base de vendas para calcular a receita
                const revenue = sales * priceBRL * 0.65; // Fator 0.65 fixo para este método
                return { method: 'Receita Simplificada (Fator 0.65)', sales, revenue };
            }
            default:
                return null;
        }
    };

    const calculations = useMemo(() => {
        const { reviews, priceBRL, discountFactor, ccuPeak, nbMultiplier, category, methodsToCombine } = values;
        
        const allMethods: { method: EstimationMethod, result: { sales: number, revenue: number, method: string } | null }[] = [
            { method: 'boxleiter', result: calculateMethod('boxleiter', reviews, priceBRL, discountFactor, ccuPeak, nbMultiplier, category) },
            { method: 'carless', result: calculateMethod('carless', reviews, priceBRL, discountFactor, ccuPeak, nbMultiplier, category) },
            { method: 'gamalytic', result: calculateMethod('gamalytic', reviews, priceBRL, discountFactor, ccuPeak, nbMultiplier, category) },
            { method: 'vginsights', result: calculateMethod('vginsights', reviews, priceBRL, discountFactor, ccuPeak, nbMultiplier, category) },
            { method: 'ccu', result: calculateMethod('ccu', reviews, priceBRL, discountFactor, ccuPeak, nbMultiplier, category) },
            { method: 'revenue', result: calculateMethod('revenue', reviews, priceBRL, discountFactor, ccuPeak, nbMultiplier, category) },
        ];

        const results = allMethods.map(m => m.result).filter((r): r is NonNullable<typeof r> => r !== null);

        // Calcula a média combinada apenas dos métodos selecionados
        const combinedResults = results.filter(r => {
            // O nome do método no resultado pode ter parênteses, então usamos o método original (EstimationMethod) para filtrar
            const baseMethod = allMethods.find(m => m.result === r)?.method;
            return baseMethod && methodsToCombine.includes(baseMethod);
        });

        const totalSales = combinedResults.reduce((sum, r) => sum + r.sales, 0);
        const totalRevenue = combinedResults.reduce((sum, r) => sum + r.revenue, 0);
        const count = combinedResults.length;

        const avgSales = count > 0 ? totalSales / count : 0;
        const avgRevenue = count > 0 ? totalRevenue / count : 0;

        return {
            allMethods: results,
            avgSales,
            avgRevenue,
            count,
        };
    }, [values]);

    const handleSelectAverage = () => {
        const avgGame: EstimatedGame = {
            name: `${gameName} (Média Híbrida)`,
            launchDate: null,
            suggestedPrice: values.priceBRL,
            priceUSD: values.priceBRL / 5, // Placeholder USD
            reviewCount: values.reviews,
            reviewSummary: 'Estimativa',
            developer: null,
            publisher: null,
            capsuleImageUrl: null,
            source: 'Fórmulas de Estimativa',
            estimatedSales: calculations.avgSales,
            estimatedRevenue: calculations.avgRevenue,
            estimationMethod: 'Média Híbrida',
        };
        onEstimate(avgGame);
    };
    
    const handleSelectMethod = (methodResult: { sales: number, revenue: number, method: string }) => {
        const singleGame: EstimatedGame = {
            name: `${gameName} (${methodResult.method})`,
            launchDate: null,
            suggestedPrice: values.priceBRL,
            priceUSD: values.priceBRL / 5,
            reviewCount: values.reviews,
            reviewSummary: 'Estimativa',
            developer: null,
            publisher: null,
            capsuleImageUrl: null,
            source: 'Fórmulas de Estimativa',
            estimatedSales: methodResult.sales,
            estimatedRevenue: methodResult.revenue,
            estimationMethod: methodResult.method,
        };
        onEstimate(singleGame);
    };

    const methodOptions: { method: EstimationMethod, label: string, description: string, source: string }[] = [
        { 
            method: 'boxleiter', 
            label: 'Boxleiter Ajustado (M=30)', 
            description: 'Fórmula clássica simplificada: Vendas ≈ Reviews x 30. É uma estimativa de ciclo de vida total, baseada em dados históricos de 2014-2017.',
            source: 'Referências: Artigos de Daniel Ahmad e fóruns de desenvolvedores (2017).'
        },
        { 
            method: 'carless', 
            label: 'Simon Carless (NB)', 
            description: 'Multiplicador baseado no ano de lançamento (NB Number), ajustando para a mudança de reviews da Steam. Tende a ser mais conservador para jogos recentes.',
            source: 'Referências: Blog HowToMarketAGame (Simon Carless).'
        },
        { 
            method: 'gamalytic', 
            label: 'Gamalytic (Preço Ponderado)', 
            description: 'Multiplicador ajustado pelo preço do jogo. Jogos baratos (<R$25) usam M=20; jogos caros (>R$100) usam M=50. Foca em como o preço afeta a taxa de conversão de reviews.',
            source: 'Referências: Análises da plataforma Gamalytic.'
        },
        { 
            method: 'vginsights', 
            label: 'VG Insights (Gênero Ponderado)', 
            description: 'Multiplicador ajustado pelo gênero. Nichos (RPG/Horror) usam M=30; Casuais/Simulação usam M=55. Leva em conta o engajamento do público por categoria.',
            source: 'Referências: Relatórios de mercado da VG Insights.'
        },
        { 
            method: 'ccu', 
            label: 'SteamDB CCU', 
            description: 'Vendas Totais ≈ Pico CCU x M_CCU. M_CCU é 40 para Multiplayer e 100 para Singleplayer. Estima o ciclo de vida total com base na popularidade máxima.',
            source: 'Referências: Análises de dados públicos do SteamDB e fóruns de engenharia reversa.'
        },
        { 
            method: 'revenue', 
            label: 'Receita Simplificada', 
            description: 'Estima a Receita Líquida: (Reviews x 30) x Preço x 0.65. O fator 0.65 remove taxas da Steam e impostos, focando no retorno financeiro.',
            source: 'Referências: Fórmulas de cálculo de receita líquida pós-Steam (30% fee).'
        },
    ];

    // Helper para renderizar o Label com Tooltip
    const renderLabelWithTooltip = (label: string, tooltipContent: React.ReactNode) => (
        <div className="flex items-center space-x-1">
            <FormLabel>{label}</FormLabel>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    {tooltipContent}
                </TooltipContent>
            </Tooltip>
        </div>
    );

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
                        <h4 className="text-md font-semibold text-gogo-cyan">Dados de Entrada</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="reviews"
                                render={({ field }) => (
                                    <FormItem>
                                        {renderLabelWithTooltip("Reviews Totais (Steam)", (
                                            <p>O número total de avaliações de usuários na Steam. Este é o principal ponto de dados para a maioria das metodologias de estimativa.</p>
                                        ))}
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
                            <FormField
                                control={form.control}
                                name="discountFactor"
                                render={({ field }) => (
                                    <FormItem>
                                        {renderLabelWithTooltip("Fator de Receita Líquida", (
                                            <p>Fator usado para calcular a receita líquida após taxas (Steam, impostos). Ex: 0.65 (65%) é um valor comum após a taxa de 30% da Steam.</p>
                                        ))}
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.65" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gênero (VG Insights)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o Gênero" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {MOCK_CATEGORIES.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nbMultiplier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Multiplicador NB (Carless)</FormLabel>
                                        <Select onValueChange={val => field.onChange(Number(val))} defaultValue={String(field.value)}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o Multiplicador" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {NB_MULTIPLIERS.map(m => (
                                                    <SelectItem key={m.label} value={String(m.value)}>{m.label}</SelectItem>
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
                                        {renderLabelWithTooltip("Pico CCU (SteamDB)", (
                                            <p>O número máximo de jogadores simultâneos (Concurrent Users) que o jogo atingiu na Steam. Usado para a Metodologia SteamDB CCU.</p>
                                        ))}
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
                                                    <SelectItem key={m.label} value={String(m.value)}>{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        
                        <Separator />

                        {/* Resultados da Estimativa (fora da tag <form>, mas dentro de <Form>) */}
                        <h4 className="text-lg font-semibold text-gogo-cyan flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" /> Resultados por Método
                        </h4>
                        <div className="space-y-3">
                            {calculations.allMethods.map((res, index) => {
                                const methodInfo = methodOptions.find(m => m.label === res.method.split('(')[0].trim());
                                
                                return (
                                    <Card key={index} className="p-3 border-l-4 border-gogo-orange/50">
                                        <CardTitle className="text-sm font-bold mb-1 flex justify-between items-center">
                                            <span>{res.method}</span>
                                            {methodInfo && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p className="font-semibold">{methodInfo.label}</p>
                                                        <p className="text-xs mt-1">{methodInfo.description}</p>
                                                        <p className="text-xs mt-1 italic text-gogo-cyan">{methodInfo.source}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </CardTitle>
                                        <div className="flex justify-between text-sm">
                                            <p className="text-muted-foreground flex items-center"><List className="h-3 w-3 mr-1" /> Vendas Estimadas:</p>
                                            <p className="font-medium text-gogo-cyan">{formatNumber(res.sales)}</p>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <p className="text-muted-foreground flex items-center"><DollarSign className="h-3 w-3 mr-1" /> Receita Líquida Estimada:</p>
                                            <p className="font-medium text-gogo-orange">{formatCurrency(res.revenue)}</p>
                                        </div>
                                        <Button 
                                            onClick={() => handleSelectMethod(res)} 
                                            variant="outline" 
                                            size="sm"
                                            className="w-full mt-2 text-xs bg-gogo-cyan/10 hover:bg-gogo-cyan/20 text-gogo-cyan"
                                        >
                                            Selecionar {res.method} (Jogo 2)
                                        </Button>
                                    </Card>
                                );
                            })}
                        </div>

                        <Separator />
                        
                        {/* Seleção de Métodos para Média Híbrida */}
                        <h4 className="text-lg font-semibold text-gogo-orange flex items-center mb-3">
                            <Gauge className="h-4 w-4 mr-2" /> Média Híbrida ({calculations.count} métodos)
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p className="font-semibold">Média Híbrida</p>
                                    <p className="text-xs mt-1">Calcula a média aritmética dos métodos selecionados.</p>
                                    <p className="text-xs">Ajuda a mitigar vieses de um único modelo, fornecendo um valor mais robusto.</p>
                                </TooltipContent>
                            </Tooltip>
                        </h4>
                        <FormField
                            control={form.control}
                            name="methodsToCombine"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium">Métodos a incluir na Média:</FormLabel>
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        {methodOptions.map((option) => {
                                            const methodKey = option.method;
                                            const isChecked = field.value.includes(methodKey);
                                            
                                            // Verifica se o método CCU pode ser calculado
                                            const isDisabled = methodKey === 'ccu' && values.ccuPeak === 0;

                                            return (
                                                <div key={methodKey} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`method-${methodKey}`}
                                                        checked={isChecked}
                                                        disabled={isDisabled}
                                                        onChange={() => {
                                                            if (isChecked) {
                                                                field.onChange(field.value.filter((v) => v !== methodKey));
                                                            } else {
                                                                field.onChange([...field.value, methodKey]);
                                                            }
                                                        }}
                                                        className="h-4 w-4 text-gogo-cyan border-gray-300 rounded focus:ring-gogo-cyan"
                                                    />
                                                    <label
                                                        htmlFor={`method-${methodKey}`}
                                                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}
                                                    >
                                                        {option.label} {isDisabled && '(CCU = 0)'}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Média Híbrida */}
                        <Card className="p-4 bg-gogo-orange/10 border-2 border-gogo-orange shadow-gogo-orange-glow/30 mt-4">
                            <CardTitle className="text-xl font-bold mb-2 flex items-center text-gogo-orange">
                                <Gauge className="h-5 w-5 mr-2" /> Média Híbrida ({calculations.count} Métodos)
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mb-3">
                                A Média Híbrida combina os resultados dos métodos selecionados para fornecer uma estimativa mais robusta e menos enviesada.
                            </p>
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
                                className="w-full mt-4 bg-gogo-cyan hover:bg-gogo-cyan/90"
                                disabled={calculations.avgSales === 0}
                            >
                                Selecionar Média Híbrida para Comparação (Jogo 2)
                            </Button>
                        </Card>

                        <div className="flex justify-end pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Fechar
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default GameEstimator;