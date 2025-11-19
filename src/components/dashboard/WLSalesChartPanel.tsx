"use client";

import React from 'react';
import { WLSalesEntry } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { formatDate } from '@/lib/utils';

interface WLSalesChartPanelProps {
    data: WLSalesEntry[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const dateLabel = formatDate(label);
        return (
            <div className="bg-white/90 dark:bg-gray-800/90 p-3 border rounded-md shadow-lg text-sm">
                <p className="font-bold mb-1">{dateLabel}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }}>
                        {entry.name}: {entry.value.toLocaleString('pt-BR')}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const WLSalesChartPanel: React.FC<WLSalesChartPanelProps> = ({ data }) => {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Evolução Diária de Wishlists e Vendas</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Nenhum dado de WL/Vendas disponível para este jogo.</p></CardContent>
            </Card>
        );
    }

    // Recharts expects data to be an array of objects with keys for X and Y axes.
    // We use the raw date number as the key for XAxis and format it in the tooltip/label.
    const chartData = data.map(item => ({
        date: item.date ? item.date.getTime() : null, // Use timestamp for sorting/keying
        Wishlists: item.wishlists,
        Vendas: item.sales,
    })).filter(item => item.date !== null);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Evolução Diária de Wishlists e Vendas</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(tick) => formatDate(tick)} 
                            minTickGap={30}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="Wishlists" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="Vendas" 
                            stroke="hsl(var(--accent-foreground))" 
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default WLSalesChartPanel;