"use client";

import React, { useMemo } from 'react';
import { WLSalesPlatformEntry, Platform } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts';
import { formatNumber } from '@/lib/utils'; // Removed formatCurrency
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import resolveConfig from 'tailwindcss/resolveConfig'; // Removed
// import tailwindConfig from '../../../tailwind.config'; // Removed

interface WlComparisonsPanelProps {
    data: WLSalesPlatformEntry[];
    allPlatforms: Platform[];
}

// Cores Gogo Games (Hardcoded para evitar dependência de tailwind.config)
const WL_COLOR = "#00BFFF"; // Gogo Cyan
const SALES_COLOR = "#FF6600"; // Gogo Orange
const CONVERSION_COLOR = "#4285F4"; // Um azul para conversão (Google Ads blue)
const GROWTH_COLOR = "#10b981"; // Um verde para crescimento (Emerald 500)

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const dateLabel = new Date(label).toLocaleDateString('pt-BR');
        return (
            <div className="bg-white/90 dark:bg-gray-800/90 p-3 border rounded-md shadow-lg text-sm backdrop-blur-sm">
                <p className="font-bold mb-2 text-base">{dateLabel}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={`item-${index}`} className="flex justify-between items-center" style={{ color: entry.color }}>
                        <span>{entry.name}:</span>
                        <span className="font-medium ml-2">
                            {entry.name.includes('Taxa') || entry.name.includes('Crescimento') ? `${(entry.value * 100).toFixed(2)}%` : formatNumber(entry.value)}
                        </span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const WlComparisonsPanel: React.FC<WlComparisonsPanelProps> = ({ data, allPlatforms }) => {
    const [selectedComparisonPlatform, setSelectedComparisonPlatform] = React.useState<Platform | 'All'>('All');

    const filteredComparisonData = useMemo(() => {
        return data.filter(entry => 
            selectedComparisonPlatform === 'All' || entry.platform === selectedComparisonPlatform
        ).sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
    }, [data, selectedComparisonPlatform]);

    // Chart 1: Wishlists & Sales by Platform (Stacked Bar Chart)
    const wlSalesByPlatform = useMemo(() => {
        const summary = filteredComparisonData.reduce((acc, entry) => {
            const platform = entry.platform;
            if (!acc[platform]) {
                acc[platform] = { platform, Wishlists: 0, Vendas: 0 };
            }
            // For wishlists, we want the latest value, not a sum
            // For simplicity in this stacked bar, we'll sum sales and take max WL for the period
            acc[platform].Vendas += entry.sales;
            if (entry.wishlists > acc[platform].Wishlists) {
                acc[platform].Wishlists = entry.wishlists;
            }
            return acc;
        }, {} as Record<Platform, { platform: Platform; Wishlists: number; Vendas: number }>);

        return Object.values(summary);
    }, [filteredComparisonData]);

    // Chart 2: Wishlist Growth Rate over Time (Line Chart)
    const wlGrowthRateOverTime = useMemo(() => {
        const dailyDataMap = new Map<number, { date: number, wishlists: number, sales: number }>();

        filteredComparisonData.forEach(entry => {
            if (entry.date) {
                const dateKey = entry.date.getTime();
                const existing = dailyDataMap.get(dateKey) || { date: dateKey, wishlists: 0, sales: 0 };
                existing.wishlists = Math.max(existing.wishlists, entry.wishlists); // Take max WL for the day
                existing.sales += entry.sales; // Sum sales for the day
                dailyDataMap.set(dateKey, existing);
            }
        });

        const sortedDailyData = Array.from(dailyDataMap.values()).sort((a, b) => a.date - b.date);

        const result = [];
        for (let i = 0; i < sortedDailyData.length; i++) {
            const current = sortedDailyData[i];
            const previous = sortedDailyData[i - 1];

            let wlGrowthRate = 0;
            if (previous && previous.wishlists > 0) {
                wlGrowthRate = (current.wishlists - previous.wishlists) / previous.wishlists;
            }

            let conversionRate = 0;
            if (current.wishlists > 0) {
                conversionRate = current.sales / current.wishlists;
            }

            result.push({
                date: current.date,
                'Taxa de Crescimento WL': wlGrowthRate,
                'Taxa de Conversão (Vendas/WL)': conversionRate,
            });
        }
        return result;
    }, [filteredComparisonData]);

    if (data.length === 0) {
        return (
            <Card className="shadow-md">
                <CardHeader><CardTitle>Comparações de Wishlists e Vendas</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Nenhum dado de WL/Vendas disponível para comparações.</p></CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-sm">
                <CardContent className="flex flex-col md:flex-row items-center gap-4 p-4">
                    <label htmlFor="comparison-platform-select" className="font-semibold text-md min-w-[150px] text-gray-700 dark:text-gray-200">Filtrar Comparações por Plataforma:</label>
                    <Select onValueChange={(value: Platform | 'All') => setSelectedComparisonPlatform(value)} defaultValue={selectedComparisonPlatform}>
                        <SelectTrigger id="comparison-platform-select" className="w-full md:w-[200px] bg-background">
                            <SelectValue placeholder="Todas as Plataformas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">Todas as Plataformas</SelectItem>
                            {allPlatforms.map(platform => (
                                <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {wlSalesByPlatform.length > 0 && (
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>Wishlists e Vendas por Plataforma</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={wlSalesByPlatform}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="platform" stroke="hsl(var(--foreground))" />
                                <YAxis tickFormatter={(value) => formatNumber(value)} stroke="hsl(var(--foreground))" />
                                <Tooltip formatter={(value) => formatNumber(value as number)} />
                                <Legend />
                                <Bar dataKey="Wishlists" stackId="a" fill={WL_COLOR} name="Wishlists (Último Reg.)" />
                                <Bar dataKey="Vendas" stackId="a" fill={SALES_COLOR} name="Vendas Totais" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {wlGrowthRateOverTime.length > 0 && (
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>Taxa de Crescimento de Wishlists e Conversão (Vendas/WL)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={wlGrowthRateOverTime}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(tick) => new Date(tick).toLocaleDateString('pt-BR')} 
                                    minTickGap={30}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    stroke="hsl(var(--foreground))"
                                />
                                <YAxis yAxisId="left" orientation="left" stroke={GROWTH_COLOR} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                <YAxis yAxisId="right" orientation="right" stroke={CONVERSION_COLOR} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="Taxa de Crescimento WL" stroke={GROWTH_COLOR} strokeWidth={2} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="Taxa de Conversão (Vendas/WL)" stroke={CONVERSION_COLOR} strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default WlComparisonsPanel;