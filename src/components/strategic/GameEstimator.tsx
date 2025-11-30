import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Calculator, TrendingUp, DollarSign, List, Info, CheckSquare, Clock, BookOpen, Gauge } from 'lucide-react'; // Changed Checkbox to CheckSquare
import KpiCard from '../dashboard/KpiCard';
import { GameEstimatorResult, EstimatorFormValues } from '@/data/trackingData';

// --- Constants ---

const ESTIMATION_METHODS = [
    'VG Insights (Reviews)',
    'CCU Peak (SteamDB)',
    'NB Multiplier (Wishlists)',
    'Média Combinada',
];

// --- Schema ---

const EstimatorFormSchema = z.object({
    category: z.string().optional(),
    reviews: z.coerce.number().min(0, "Reviews deve ser >= 0."),
    priceBRL: z.coerce.number().min(0, "Preço BRL deve ser >= 0."),
    discountFactor: z.coerce.number().min(0).max(1, "Fator de Desconto deve ser entre 0 e 1."),
    ccuPeak: z.coerce.number().min(0, "CCU Peak deve ser >= 0.").optional(),
    nbMultiplier: z.coerce.number().min(0, "Multiplicador NB deve ser >= 0.").optional(),
    ccuMultiplier: z.coerce.number().min(0, "Multiplicador CCU deve ser >= 0.").optional(),
    methodsToCombine: z.array(z.string()).default([]),
});

// --- Calculation Logic (Simplified Placeholder) ---

const calculateMethod = (method: string, values: EstimatorFormValues): GameEstimatorResult | null => {
    const priceUSD = values.priceBRL / 5.0; // Assuming R$5.00 = $1.00 for estimation
    const effectivePrice = priceUSD * (1 - values.discountFactor);

    let sales = 0;
    let timeframe = 'Lançamento';

    switch (method) {
        case 'VG Insights (Reviews)':
            // Simplified formula: Sales = Reviews * Multiplier (e.g., 30)
            sales = values.reviews * 30;
            timeframe = 'Estimativa Total';
            break;
        case 'CCU Peak (SteamDB)':
            if (values.ccuPeak && values.ccuMultiplier) {
                // Simplified formula: Sales = CCU Peak * Multiplier (e.g., 100)
                sales = values.ccuPeak * values.ccuMultiplier;
                timeframe = 'Estimativa Total';
            } else {
                return null;
            }
            break;
        case 'NB Multiplier (Wishlists)':
            // This method usually requires actual WL data, but we'll use a placeholder based on reviews for now
            if (values.nbMultiplier) {
                sales = values.reviews * values.nbMultiplier; // Placeholder: Reviews * NB Multiplier
                timeframe = 'Estimativa Total';
            } else {
                return null;
            }
            break;
        default:
            return null;
    }

    const revenue = sales * effectivePrice;

    return {
        method,
        sales: Math.round(sales),
        revenue: revenue,
        timeframe,
    };
};

// --- Component ---

const GameEstimator: React.FC = () => {
    const [results, setResults] = useState<GameEstimatorResult[]>([]);

    const form = useForm<z.infer<typeof EstimatorFormSchema>>({
        resolver: zodResolver(EstimatorFormSchema),
        defaultValues: {
            category: 'Indie',
            reviews: 100,
            priceBRL: 50.00,
            discountFactor: 0.15,
            ccuPeak: 500,
            nbMultiplier: 10,
            ccuMultiplier: 100,
            methodsToCombine: ESTIMATION_METHODS.slice(0, 3),
        },
    });

    const onSubmit = (values: z.infer<typeof EstimatorFormSchema>) => {
        const allMethods = ESTIMATION_METHODS.filter(m => m !== 'Média Combinada');

        const individualResults = allMethods
            .map(method => calculateMethod(method, values as EstimatorFormValues))
            .filter((r): r is NonNullable<typeof r> => r !== null);

        let finalResults = individualResults;

        if (values.methodsToCombine.length > 0) {
            const combinedResults = individualResults.filter(r => values.methodsToCombine.includes(r.method));
            if (combinedResults.length > 0) {
                const totalSales = combinedResults.reduce((sum, r) => sum + r.sales, 0);
                const totalRevenue = combinedResults.reduce((sum, r) => sum + r.revenue, 0);
                const averageSales = totalSales / combinedResults.length;
                const averageRevenue = totalRevenue / combinedResults.length;

                finalResults.push({
                    method: 'Média Combinada',
                    sales: Math.round(averageSales),
                    revenue: averageRevenue,
                    timeframe: 'Estimativa Média',
                });
            }
        }

        setResults(finalResults);
    };

    return (
        <Card className="shadow-lg border-t-4 border-gogo-cyan">
            <CardHeader>
                <CardTitle className="text-xl text-gogo-cyan flex items-center">
                    <Calculator className="h-5 w-5 mr-2" /> Estimador de Vendas de Jogos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Reviews */}
                            <FormField
                                control={form.control}
                                name="reviews"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reviews Totais</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ex: 500" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Price BRL */}
                            <FormField
                                control={form.control}
                                name="priceBRL"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preço (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="Ex: 49.99" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Discount Factor */}
                            <FormField
                                control={form.control}
                                name="discountFactor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fator de Desconto (0.0 - 1.0)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="Ex: 0.15 (15%)" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        <h4 className="text-md font-semibold text-gray-700 flex items-center">
                            <Gauge className="h-4 w-4 mr-2" /> Multiplicadores e Métodos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* CCU Peak */}
                            <FormField
                                control={form.control}
                                name="ccuPeak"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CCU Peak (Steam)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ex: 1500" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* CCU Multiplier */}
                            <FormField
                                control={form.control}
                                name="ccuMultiplier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Multiplicador CCU</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ex: 100" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* NB Multiplier */}
                            <FormField
                                control={form.control}
                                name="nbMultiplier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Multiplicador NB (Wishlists)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ex: 10" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Methods to Combine */}
                        <FormField
                            control={form.control}
                            name="methodsToCombine"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Métodos para Média Combinada</FormLabel>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {ESTIMATION_METHODS.filter(m => m !== 'Média Combinada').map((method) => (
                                            <FormField
                                                key={method}
                                                control={form.control}
                                                name="methodsToCombine"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={method}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(method)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, method])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== method
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {method}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full bg-gogo-cyan hover:bg-gogo-cyan/90">
                            <Calculator className="h-4 w-4 mr-2" /> Estimar Vendas
                        </Button>
                    </form>
                </Form>

                {/* Results Display */}
                {results.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-bold mb-4 text-gogo-orange">Resultados da Estimativa</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.map((result, index) => (
                                <Card key={index} className={result.method === 'Média Combinada' ? "border-2 border-gogo-orange shadow-xl" : "border"}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-semibold">{result.method}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-1">
                                            <p className="text-2xl font-bold text-gogo-green">{formatNumber(result.sales)}</p>
                                            <p className="text-sm text-muted-foreground">Vendas Estimadas ({result.timeframe})</p>
                                            <Separator className="my-1" />
                                            <p className="text-lg font-medium">{formatCurrency(result.revenue)}</p>
                                            <p className="text-xs text-muted-foreground">Receita Estimada</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default GameEstimator;