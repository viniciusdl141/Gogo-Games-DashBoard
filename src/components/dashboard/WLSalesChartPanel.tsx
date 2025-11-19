"use client";

import React from 'react';
import { WLSalesEntry, EntryFrequency } from '@/data/trackingData';
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
    Dot,
} from 'recharts';
import { formatDate } from '@/lib/utils';

interface WLSalesChartPanelProps {
    data: WLSalesEntry[];
}

// Cores Gogo Games
const WL_COLOR = "#10b981"; // Emerald 500 (Wishlists)
const SALES_COLOR = "#8b5cf6"; // Violet 500 (Vendas)

// Mapeamento de cores e formas para a frequência
const FREQUENCY_STYLES: Record<EntryFrequency, { fill: string, stroke: string, shape: 'circle' | 'triangle' | 'square' }> = {
    'Diário': { fill: WL_COLOR, stroke: WL_COLOR, shape: 'circle' },
    'Semanal': { fill: WL_COLOR, stroke: WL_COLOR, shape: 'triangle' },
    'Mensal': { fill: WL_COLOR, stroke: WL_COLOR, shape: 'square' },
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const dateLabel = formatDate(label);
        
        // Group data by frequency for the tooltip
        const dataByFrequency = payload.reduce((acc: Record<string, any[]>, entry: any) => {
            const frequency = entry.payload.frequency || 'Diário';
            if (!acc[frequency]) {
                acc[frequency] = [];
            }
            acc[frequency].push(entry);
            return acc;
        }, {});

        return (
            <div className="bg-white/90 dark:bg-gray-800/90 p-3 border rounded-md shadow-lg text-sm">
                <p className="font-bold mb-1">{dateLabel}</p>
                
                {Object.keys(dataByFrequency).sort().map(frequency => (
                    <div key={frequency} className="mt-2 border-t pt-1 border-muted-foreground/20">
                        <p className="font-semibold text-xs text-muted-foreground">{frequency}</p>
                        {dataByFrequency[frequency].map((entry: any, index: number) => (
                            <p key={index} style={{ color: entry.color }}>
                                {entry.name}: {entry.value.toLocaleString('pt-BR')}
                            </p>
                        ))}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Custom Dot component to change shape based on frequency
const CustomDot = (props: any) => {
    const { cx, cy, stroke, payload, dataKey } = props;
    
    // Only apply custom dot logic to Wishlists (WL)
    if (dataKey !== 'Wishlists') {
        return <Dot {...props} r={3} fill={SALES_COLOR} stroke={SALES_COLOR} />;
    }

    const frequency: EntryFrequency = payload.frequency || 'Diário';
    const style = FREQUENCY_STYLES[frequency];
    
    if (!style) return null;

    const size = 6; // Size of the shape

    switch (style.shape) {
        case 'triangle':
            // Triangle pointing up
            return (
                <polygon 
                    points={`${cx},${cy - size / 2} ${cx - size / 2},${cy + size / 2} ${cx + size / 2},${cy + size / 2}`} 
                    fill={style.fill} 
                    stroke={style.stroke} 
                    strokeWidth={1}
                />
            );
        case 'square':
            // Square
            return (
                <rect 
                    x={cx - size / 2} 
                    y={cy - size / 2} 
                    width={size} 
                    height={size} 
                    fill={style.fill} 
                    stroke={style.stroke} 
                    strokeWidth={1}
                />
            );
        case 'circle':
        default:
            // Circle (default for Diário)
            return (
                <Dot 
                    cx={cx} 
                    cy={cy} 
                    r={4} 
                    fill={style.fill} 
                    stroke={style.stroke} 
                    strokeWidth={1}
                />
            );
    }
};

const CustomLegend = (props: any) => {
    const { payload } = props;

    // Define os itens fixos da legenda
    const fixedItems = [
        { value: 'Vendas', color: SALES_COLOR, type: 'line' },
        { value: 'Wishlists (Diário)', color: WL_COLOR, type: 'circle' },
        { value: 'Wishlists (Semanal)', color: WL_COLOR, type: 'triangle' },
        { value: 'Wishlists (Mensal)', color: WL_COLOR, type: 'square' },
    ];

    return (
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 p-2 text-sm">
            {fixedItems.map((entry, index) => {
                const style = FREQUENCY_STYLES[entry.value.includes('Diário') ? 'Diário' : entry.value.includes('Semanal') ? 'Semanal' : entry.value.includes('Mensal') ? 'Mensal' : 'Diário'];
                
                return (
                    <li key={`item-${index}`} className="flex items-center space-x-1 cursor-pointer">
                        {entry.value === 'Vendas' ? (
                            <span className="w-4 h-0.5" style={{ backgroundColor: entry.color }}></span>
                        ) : (
                            <svg width="10" height="10" viewBox="0 0 10 10" className="mr-1">
                                {style.shape === 'circle' && <circle cx="5" cy="5" r="4" fill={style.fill} />}
                                {style.shape === 'triangle' && <polygon points="5,1 1,9 9,9" fill={style.fill} />}
                                {style.shape === 'square' && <rect x="1" y="1" width="8" height="8" fill={style.fill} />}
                            </svg>
                        )}
                        <span className="text-muted-foreground">{entry.value}</span>
                    </li>
                );
            })}
        </ul>
    );
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
    const chartData = data.map(item => ({
        date: item.date ? item.date.getTime() : null, // Use timestamp for sorting/keying
        Wishlists: item.wishlists,
        Vendas: item.sales,
        frequency: item.frequency, // Pass frequency data
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
                        <Legend content={<CustomLegend />} />
                        <Line 
                            type="monotone" 
                            dataKey="Wishlists" 
                            stroke={WL_COLOR}
                            strokeWidth={2}
                            dot={<CustomDot dataKey="Wishlists" />} // Use CustomDot for Wishlists
                            activeDot={{ r: 8 }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="Vendas" 
                            stroke={SALES_COLOR}
                            strokeWidth={2}
                            dot={false} // Keep sales line simple
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default WLSalesChartPanel;