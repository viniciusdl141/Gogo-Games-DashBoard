"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KpiCard from './KpiCard';
import { TrendingUp, Percent, DollarSign, List, CalendarDays, Clock, MousePointerClick } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type TimeFrame = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'total';

interface WlConversionKpisPanelProps {
    avgDailyGrowth: number;
    totalGrowth: number;
    timeFrame: TimeFrame;
    onTimeFrameChange: (timeFrame: TimeFrame) => void;
    visitorToWlConversionRate: number;
    wlToSalesConversionRate: number;
    onCardClick: (tab: 'wl-sales' | 'traffic') => void; // Novo prop para navegação
}

const formatPercentage = (value: number): string => {
    if (value === 0 || isNaN(value)) return '-';
    return `${(value * 100).toFixed(2)}%`;
};

const timeFrameLabels: Record<TimeFrame, string> = {
    weekly: 'Últimos 7 Dias',
    monthly: 'Últimos 30 Dias',
    quarterly: 'Últimos 90 Dias',
    semiannual: 'Últimos 180 Dias',
    annual: 'Últimos 365 Dias',
    total: 'Total (Desde o Início)',
};

const WlConversionKpisPanel: React.FC<WlConversionKpisPanelProps> = ({
    avgDailyGrowth,
    totalGrowth,
    timeFrame,
    onTimeFrameChange,
    visitorToWlConversionRate,
    wlToSalesConversionRate,
    onCardClick,
}) => {
    // Determine trend for total growth visualization
    const growthTrend = totalGrowth > 0 ? 'text-green-500' : totalGrowth < 0 ? 'text-red-500' : 'text-muted-foreground';
    const growthIcon = totalGrowth > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-muted-foreground" />;
    
    const avgGrowthTitle = `Crescimento Diário Médio WL (${timeFrameLabels[timeFrame]})`;
    const totalGrowthTitle = `Crescimento Total WL (${timeFrameLabels[timeFrame]})`;

    // Componente auxiliar para tornar o KpiCard clicável
    const ClickableKpiCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, description: React.ReactNode, targetTab: 'wl-sales' | 'traffic' }> = ({ title, value, icon, description, targetTab }) => (
        <div 
            onClick={() => onCardClick(targetTab)} 
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
        >
            <KpiCard 
                title={title} 
                value={value} 
                icon={icon} 
                description={
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{description}</p>
                        <MousePointerClick className="h-3 w-3 text-gogo-cyan/70" />
                    </div>
                }
            />
        </div>
    );

    return (
        <Card className="shadow-xl border border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-gogo-orange">KPIs de Crescimento e Conversão</CardTitle>
                <div className="flex items-center space-x-2">
                    <Label htmlFor="timeframe-select" className="text-sm text-muted-foreground">Período:</Label>
                    <Select onValueChange={(value: TimeFrame) => onTimeFrameChange(value)} defaultValue={timeFrame}>
                        <SelectTrigger id="timeframe-select" className="w-[180px] bg-background h-8">
                            <SelectValue placeholder="Selecione o Período" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(timeFrameLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 md:grid-cols-4">
                    
                    {/* 1. Crescimento Diário Médio WL (Período Selecionado) */}
                    <ClickableKpiCard 
                        title={avgGrowthTitle} 
                        value={formatNumber(avgDailyGrowth.toFixed(0))} 
                        icon={<TrendingUp className="h-4 w-4 text-gogo-cyan" />} 
                        description="Média de wishlists ganhas por dia no período."
                        targetTab="wl-sales"
                    />

                    {/* 2. Crescimento Total no Período Selecionado */}
                    <ClickableKpiCard 
                        title={totalGrowthTitle} 
                        value={formatNumber(totalGrowth)} 
                        icon={growthIcon} 
                        description={<span className={growthTrend}>Total de wishlists ganhas no período selecionado.</span>}
                        targetTab="wl-sales"
                    />

                    {/* 3. Conversão Visitante -> WL */}
                    <ClickableKpiCard 
                        title="Conversão Visitante -> WL" 
                        value={formatPercentage(visitorToWlConversionRate)} 
                        icon={<Percent className="h-4 w-4 text-gogo-orange" />} 
                        description="Taxa de conversão da página Steam (Visitas -> WL)."
                        targetTab="traffic"
                    />

                    {/* 4. Conversão WL -> Vendas */}
                    <ClickableKpiCard 
                        title="Conversão WL -> Vendas" 
                        value={formatPercentage(wlToSalesConversionRate)} 
                        icon={<DollarSign className="h-4 w-4 text-gogo-cyan" />} 
                        description="Taxa de conversão pós-lançamento (WL -> Vendas)."
                        targetTab="wl-sales"
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default WlConversionKpisPanel;