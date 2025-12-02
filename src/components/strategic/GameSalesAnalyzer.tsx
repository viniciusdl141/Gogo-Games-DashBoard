"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GameOption } from '@/integrations/supabase/games';
import { WLSalesPlatformEntry } from '@/data/trackingData';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { DollarSign, List, TrendingUp, Clock, Gauge, Info } from 'lucide-react'; 
import { differenceInMonths, differenceInDays, isPast, startOfDay } from 'date-fns';
import KpiCard from '../dashboard/KpiCard'; 

interface GameSalesAnalyzerProps {
    game: GameOption;
    wlSalesData: WLSalesPlatformEntry[];
}

const GameSalesAnalyzer: React.FC<GameSalesAnalyzerProps> = ({ game, wlSalesData }) => {
    const temporalAnalysis = useMemo(() => {
        const launchDate = game.launch_date ? new Date(game.launch_date) : null;
        const salesData = wlSalesData.filter(e => e.game === game.name && e.sales > 0);

        if (!launchDate || salesData.length === 0) {
            return {
                timeframe: 'N/A',
                totalSales: 0,
                totalRevenue: 0,
                averageSpeed: 'N/A',
                verdict: 'Aguardando dados de vendas pós-lançamento.',
            };
        }

        const today = startOfDay(new Date());
        const isLaunched = isPast(launchDate);

        if (!isLaunched) {
            return {
                timeframe: 'Pré-lançamento',
                totalSales: 0,
                totalRevenue: 0,
                averageSpeed: 'N/A',
                verdict: 'Aguardando lançamento.',
            };
        }

        const totalSales = salesData.reduce((sum, entry) => sum + entry.sales, 0);
        const totalRevenue = totalSales * (game.suggested_price || 19.99);
        
        const monthsSinceLaunch = differenceInMonths(today, launchDate);
        const effectiveMonths = Math.max(1, monthsSinceLaunch); // Garante pelo menos 1 mês para divisão

        const averageSpeed = totalSales / effectiveMonths;

        let verdict = 'Análise em andamento.';
        if (averageSpeed > 1000) {
            verdict = 'Vendas fortes! Acima da média.';
        } else if (averageSpeed > 300) {
            verdict = 'Vendas estáveis. Mantendo o ritmo.';
        } else {
            verdict = 'Vendas lentas. Necessita de impulso de marketing.';
        }

        return {
            timeframe: `${effectiveMonths} meses`,
            totalSales,
            totalRevenue,
            averageSpeed: formatNumber(averageSpeed), // Corrigido o erro 17
            verdict,
        };
    }, [game, wlSalesData]);

    return (
        <Card className="shadow-lg transition-all duration-300 hover:shadow-xl border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl flex items-center text-gogo-cyan">
                    <Clock className="h-5 w-5 mr-2" /> Análise Temporal de Vendas
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard 
                        title="Tempo de Mercado"
                        value={temporalAnalysis.timeframe}
                        description="Período desde o lançamento (ou pré-lançamento)"
                        icon={<Clock className="h-4 w-4 text-gogo-cyan" />}
                    />
                    <KpiCard 
                        title="Velocidade Média de Vendas"
                        value={temporalAnalysis.averageSpeed} 
                        icon={<TrendingUp className="h-4 w-4 text-gogo-orange" />} 
                        description="Cópia vendidas por mês (Média Geral / Meses)"
                    />
                    <KpiCard 
                        title="Veredito Temporal"
                        value={temporalAnalysis.verdict}
                        description="Avaliação da performance de vendas ao longo do tempo"
                        icon={<Info className="h-4 w-4 text-green-500" />}
                        className={temporalAnalysis.verdict.includes('lenta') ? 'border-red-500/50' : temporalAnalysis.verdict.includes('forte') ? 'border-green-500/50' : ''}
                    />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <KpiCard
                        title="Vendas Totais (Pós-Lançamento)"
                        value={formatNumber(temporalAnalysis.totalSales)}
                        description="Unidades vendidas desde o lançamento"
                        icon={<List className="h-4 w-4 text-gogo-cyan" />}
                    />
                    <KpiCard
                        title="Receita Total Estimada"
                        value={formatCurrency(temporalAnalysis.totalRevenue)}
                        description={`Baseado no preço sugerido de ${formatCurrency(game.suggested_price || 19.99)}`}
                        icon={<DollarSign className="h-4 w-4 text-gogo-orange" />}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default GameSalesAnalyzer;