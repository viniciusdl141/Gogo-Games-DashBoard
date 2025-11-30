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
import { Calculator, TrendingUp, DollarSign, List, Info, Checkbox, Clock, BookOpen, Gauge } from 'lucide-react';
import KpiCard from '../dashboard/KpiCard';
import { GameOption } from '@/integrations/supabase/functions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import MethodDetailsModal from './MethodDetailsModal';
import { 
    MOCK_CATEGORIES, 
    NB_MULTIPLIERS, 
    CCU_MULTIPLIERS, 
    METHOD_DETAILS, 
    MethodDetails as MethodDetailsType 
} from '@/lib/constants';
import { 
    calculateMethod, 
    calculateHybridAverage, 
    EstimationMethod, 
    EstimatorFormValues as EstimatorFormValuesBase, 
    MethodResult 
} from '@/lib/estimation-logic';

// --- Interfaces e Tipos ---

export interface EstimatedGame extends GameOption {
    estimatedSales: number;
    estimatedRevenue: number;
    estimationMethod: string;
    timeframe: string; 
}

// Schema de validação (usando o tipo base da lógica)
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

// Array de opções de métodos para o checkbox de combinação
const methodOptions: { method: EstimationMethod, label: string }[] = [
    { method: 'boxleiter', label: 'Boxleiter Ajustado' },
    { method: 'carless', label: 'Simon Carless (NB)' },
    { method: 'gamalytic', label: 'Gamalytic (Preço Ponderado)' },
    { method: 'vginsights', label: 'VG Insights (Gênero Ponderado)' },
    { method: 'ccu', label: 'SteamDB CCU' },
    { method: 'revenue', label: 'Receita Simplificada' },
];


const GameEstimator: React.FC<GameEstimatorProps> = ({ gameName, initialPrice = 30.00, initialCategory = 'Ação', onEstimate, onClose }) => {
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedMethodResult, setSelectedMethodResult] = useState<MethodResult | null>(null);
    const [selectedMethodDetails, setSelectedMethodDetails] = useState<MethodDetailsType | null>(null);
    
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

    const calculations = useMemo(() => {
        const { reviews, priceBRL, discountFactor, ccuPeak, nbMultiplier, category, methodsToCombine } = values;
        
        const allMethods: EstimationMethod[] = ['boxleiter', 'carless', 'gamalytic', 'vginsights', 'ccu', 'revenue'];

        const results = allMethods
            .map(method => calculateMethod(method, values))
            .filter((r): r is NonNullable<typeof r> => r !== null);

        const { avgSales, avgRevenue, count } = calculateHybridAverage(results, methodsToCombine);

        return {
            allMethods: results,
            avgSales,
            avgRevenue,
            count,
        };
    }, [values]);

    const handleOpenDetails = (result: MethodResult) => {
        const detailsKey = Object.keys(METHOD_DETAILS).find(key => result.method.includes(key.split('(')[0].trim()));
        
        setSelectedMethodResult(result);
        setSelectedMethodDetails(METHOD_DETAILS[detailsKey || 'Média Híbrida']);
        setDetailsModalOpen(true);
    };
    
    const finalizeSelection = (result: MethodResult) => {
        const isAverage = result.method === 'Média Híbrida';
        
        const finalResult = isAverage ? calculations : { avgSales: result.sales, avgRevenue: result.revenue };

        const finalGame: EstimatedGame = {
            name: `${gameName} (${result.method})`,
            launchDate: null,
            suggestedPrice: values.priceBRL,
            priceUSD: values.priceBRL / 5,
            reviewCount: values.reviews,
            reviewSummary: 'Estimativa',
            developer: null,
            publisher: null,
            capsuleImageUrl: null,
            source: 'Fórmulas de Estimativa',
            estimatedSales: finalResult.avgSales,
            estimatedRevenue: finalResult.avgRevenue,
            estimationMethod: result.method,
            timeframe: result.timeframe,
        };
        
        onEstimate(finalGame);
        onClose(); 
    };

    const handleSelectAverage = () => {
        const avgResult: MethodResult = {
            sales: calculations.avgSales,
            revenue: calculations.avgRevenue,
            method: 'Média Híbrida',
            timeframe: 'Ciclo de Vida Total (Média Ponderada)',
        };
        
        setSelectedMethodResult(avgResult);
        setSelectedMethodDetails(METHOD_DETAILS['Média Híbrida']);
        setDetailsModalOpen(true);
    };
    
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

                        {/* Resultados da Estimativa */}
                        <h4 className="text-lg font-semibold text-gogo-cyan flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" /> Resultados por Método
                        </h4>
                        <div className="space-y-3">
                            {calculations.allMethods.map((res, index) => {
                                const detailsKey = Object.keys(METHOD_DETAILS).find(key => res.method.includes(key.split('(')[0].trim()));
                                const methodDetails = METHOD_DETAILS[detailsKey || 'Média Híbrida'];
                                
                                return (
                                    <Card key={index} className="p-3 border-l-4 border-gogo-orange/50">
                                        <CardTitle className="text-sm font-bold mb-1 flex justify-between items-center">
                                            <span>{res.method}</span>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p className="font-semibold">{methodDetails.label}</p>
                                                    <p className="text-xs mt-1">{methodDetails.description.split('**')[0].trim()}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </CardTitle>
                                        <div className="flex justify-between text-sm">
                                            <p className="text-muted-foreground flex items-center"><List className="h-3 w-3 mr-1" /> Vendas Estimadas:</p>
                                            <p className="font-medium text-gogo-cyan">{formatNumber(res.sales)}</p>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <p className="text-muted-foreground flex items-center"><DollarSign className="h-3 w-3 mr-1" /> Receita Líquida Estimada:</p>
                                            <p className="font-medium text-gogo-orange">{formatCurrency(res.revenue)}</p>
                                        </div>
                                        <div className="flex justify-between text-sm mt-1">
                                            <p className="text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1" /> Período Estimado:</p>
                                            <p className="font-medium text-muted-foreground">{res.timeframe}</p>
                                        </div>
                                        <Button 
                                            onClick={() => handleOpenDetails(res)} 
                                            variant="outline" 
                                            size="sm"
                                            className="w-full mt-2 text-xs bg-gogo-cyan/10 hover:bg-gogo-cyan/20 text-gogo-cyan"
                                        >
                                            <BookOpen className="h-3 w-3 mr-1" /> Ver Detalhes e Selecionar
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
                                                        {option.label.split('(')[0].trim()} {isDisabled && '(CCU = 0)'}
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
                                <BookOpen className="h-3 w-3 mr-1" /> Ver Detalhes e Selecionar Média
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
            
            {/* Modal de Detalhes do Método */}
            {selectedMethodResult && selectedMethodDetails && (
                <MethodDetailsModal
                    isOpen={detailsModalOpen}
                    onClose={() => setDetailsModalOpen(false)}
                    methodResult={selectedMethodResult}
                    methodDetails={selectedMethodDetails}
                    onConfirmSelection={() => {
                        finalizeSelection(selectedMethodResult);
                        setDetailsModalOpen(false); 
                    }}
                />
            )}
        </Card>
    );
};

export default GameEstimator;