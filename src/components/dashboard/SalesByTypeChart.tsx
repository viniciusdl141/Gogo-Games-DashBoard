"use client";

import React, { useMemo } from 'react';
import { WLSalesEntry } from '@/data/trackingData';
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
} from 'recharts';
import { formatNumber } from '@/lib/utils';

interface SalesByTypeChartProps {
    data: WLSalesEntry[];
}

const SalesByTypeChart: React.FC<SalesByTypeChartProps> = ({ data }) => {
    const salesSummary = useMemo(() => {
        const summary = data.reduce((acc, entry) => {
            const type = entry.saleType || 'Padrão';
            acc[type] = (acc[type] || 0) + entry.sales;
            return acc;
        }, {} as Record<string, number>);

        // Convert to array format for Recharts
        return Object.keys(summary).map(key => ({
            name: key,
            Vendas: summary[key],
        }));
    }, [data]);

    if (salesSummary.length === 0 || salesSummary.every(s => s.Vendas === 0)) {
        return null;
    }

    // Cores Gogo Games: Cyan, Orange, e um terceiro para DLC
    const COLORS = {
        'Padrão': '#00BFFF', // gogo-cyan
        'Bundle': '#FF6600', // gogo-orange
        'DLC': '#8b5cf6', // Violet (complementar)
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Vendas Totais por Tipo (Unidades)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={salesSummary}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip formatter={(value) => formatNumber(value as number)} />
                        <Bar dataKey="Vendas" fill={COLORS['Padrão']} name="Vendas" >
                            {salesSummary.map((entry, index) => (
                                <Bar key={`bar-${index}`} dataKey="Vendas" fill={COLORS[entry.name as keyof typeof COLORS] || '#6b7280'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default SalesByTypeChart;