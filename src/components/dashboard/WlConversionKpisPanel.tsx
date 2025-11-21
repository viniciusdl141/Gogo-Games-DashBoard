"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KpiCard from './KpiCard';
import { TrendingUp, Percent, DollarSign, List, CalendarDays } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface WlConversionKpisPanelProps {
    avgDailyGrowth: number;
    totalWeeklyGrowth: number;
    visitorToWlConversionRate: number;
    wlToSalesConversionRate: number;
}

const formatPercentage = (value: number): string => {
    if (value === 0 || isNaN(value)) return '-';
    return `${(value * 100).toFixed(2)}%`;
};

const WlConversionKpisPanel: React.FC<WlConversionKpisPanelProps> = ({
    avgDailyGrowth,
    totalWeeklyGrowth,
    visitorToWlConversionRate,
    wlToSalesConversionRate,
}) => {
    // Determine trend for weekly growth visualization
    const weeklyTrend = totalWeeklyGrowth > 0 ? 'text-green-500' : totalWeeklyGrowth < 0 ? 'text-red-500' : 'text-muted-foreground';
    const weeklyIcon = totalWeeklyGrowth > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <CalendarDays className="h-4 w-4 text-muted-foreground" />;

    return (
        <Card className="shadow-xl border border-border">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-gogo-orange">KPIs de Crescimento e Conversão</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 md:grid-cols-4">
                    
                    {/* 1. Crescimento Diário Médio WL */}
                    <KpiCard 
                        title="Crescimento Diário Médio WL" 
                        value={formatNumber(avgDailyGrowth.toFixed(0))} 
                        icon={<TrendingUp className="h-4 w-4 text-gogo-cyan" />} 
                        description="Média de wishlists ganhas por dia (período total)."
                    />

                    {/* 2. Crescimento Semanal WL */}
                    <KpiCard 
                        title="Crescimento Semanal WL" 
                        value={formatNumber(totalWeeklyGrowth)} 
                        icon={weeklyIcon} 
                        description={<span className={weeklyTrend}>Total de wishlists ganhas nos últimos 7 dias.</span>}
                    />

                    {/* 3. Conversão Visitante -> WL */}
                    <KpiCard 
                        title="Conversão Visitante -> WL" 
                        value={formatPercentage(visitorToWlConversionRate)} 
                        icon={<Percent className="h-4 w-4 text-gogo-orange" />} 
                        description="Taxa de conversão da página Steam (Visitas -> WL)."
                    />

                    {/* 4. Conversão WL -> Vendas */}
                    <KpiCard 
                        title="Conversão WL -> Vendas" 
                        value={formatPercentage(wlToSalesConversionRate)} 
                        icon={<DollarSign className="h-4 w-4 text-gogo-cyan" />} 
                        description="Taxa de conversão pós-lançamento (WL -> Vendas)."
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default WlConversionKpisPanel;