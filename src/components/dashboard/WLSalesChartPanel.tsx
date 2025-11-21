"use client";

import React from 'react';
import { WLSalesPlatformEntry, EntryFrequency, EventTrackingEntry } from '@/data/trackingData'; // Import EventTrackingEntry
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
import { formatDate, formatNumber } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface WLSalesChartPanelProps {
    data: WLSalesPlatformEntry[];
    onPointClick: (entry: WLSalesPlatformEntry) => void;
    eventTracking: EventTrackingEntry[]; // New prop
}

// Cores Gogo Games
const WL_COLOR = "#00BFFF"; // Gogo Cyan
const SALES_COLOR = "#FF6600"; // Gogo Orange
const EVENT_COLOR = "#FF6600"; // Usar Gogo Orange para destacar eventos

// Mapeamento de cores e formas para a frequência
const FREQUENCY_STYLES: Record<EntryFrequency, { fill: string, stroke: string, shape: 'circle' | 'triangle' | 'square' }> = {
    'Diário': { fill: WL_COLOR, stroke: WL_COLOR, shape: 'circle' },
    'Semanal': { fill: WL_COLOR, stroke: WL_COLOR, shape: 'triangle' },
    'Mensal': { fill: WL_COLOR, stroke: WL_COLOR, shape: 'square' },
};

// Helper function to check if a date is within an event period
const isDateInEvent = (date: Date | null, events: EventTrackingEntry[]): boolean => {
    if (!date) return false;
    const timestamp = date.getTime();

    return events.some(event => {
        const start = event.startDate?.getTime();
        const end = event.endDate?.getTime();
        
        if (start && end) {
            // Check if timestamp is between start and end (inclusive)
            // We need to normalize dates to start/end of day for comparison if the source data is only date (not time)
            // Since the source data uses Excel serial dates which are usually midnight, comparing timestamps should be fine.
            return timestamp >= start && timestamp <= end;
        }
        return false;
    });
};


const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const dateLabel = formatDate(label);
        
        // Group data by platform and frequency for the tooltip
        const dataByPlatform = payload.reduce((acc: Record<string, any[]>, entry: any) => {
            const platform = entry.payload.platform || 'Steam';
            if (!acc[platform]) {
                acc[platform] = [];
            }
            acc[platform].push(entry);
            return acc;
        }, {});

        return (
            <div className="bg-white/90 dark:bg-gray-800/90 p-3 border rounded-md shadow-lg text-sm backdrop-blur-sm">
                <p className="font-bold mb-2 text-base">{dateLabel}</p>
                
                {Object.keys(dataByPlatform).sort().map(platform => {
                    const platformData = dataByPlatform[platform];
                    const wlEntry = platformData.find((e: any) => e.dataKey === 'Wishlists')?.payload;
                    const salesEntry = platformData.find((e: any) => e.dataKey === 'Vendas')?.payload;

                    const variation = wlEntry?.variation || 0;
                    const totalWishlists = wlEntry?.Wishlists || 0;
                    const totalSales = salesEntry?.Vendas || 0;
                    const frequency = wlEntry?.frequency || 'Diário';

                    const VariationIcon = variation > 0 ? ArrowUp : variation < 0 ? ArrowDown : Minus;
                    const variationColor = variation > 0 ? 'text-green-500' : variation < 0 ? 'text-red-500' : 'text-muted-foreground';

                    return (
                        <div key={platform} className="mt-2 border-t pt-2 border-muted-foreground/20">
                            <p className="font-semibold text-sm mb-1 flex items-center justify-between">
                                <span>{platform} ({frequency})</span>
                                <span className="text-xs text-muted-foreground">WL: {formatNumber(totalWishlists)}</span>
                            </p>
                            
                            <div className="space-y-1">
                                <p className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Variação WL:</span>
                                    <span className={`font-medium flex items-center ${variationColor}`}>
                                        <VariationIcon className="h-3 w-3 mr-1" />
                                        {formatNumber(Math.abs(variation))}
                                    </span>
                                </p>
                                <p className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Vendas (Unidades):</span>
                                    <span className="font-medium text-gogo-cyan">
                                        {formatNumber(totalSales)}
                                    </span>
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

// Custom Dot component to change shape based on frequency and event status
const CustomDot = (props: any) => {
    const { cx, cy, stroke, payload, dataKey, eventTracking } = props;
    
    // Only apply custom dot logic to Wishlists (WL)
    if (dataKey !== 'Wishlists') {
        return <Dot {...props} r={3} fill={SALES_COLOR} stroke={SALES_COLOR} />;
    }

    const date = payload.date ? new Date(payload.date) : null;
    const isActiveEvent = isDateInEvent(date, eventTracking); // Check if date is in an event

    const frequency: EntryFrequency = payload.frequency || 'Diário';
    const style = FREQUENCY_STYLES[frequency];
    
    if (!style) return null;

    const size = isActiveEvent ? 6 : 4; // Make event dots slightly larger
    const color = isActiveEvent ? EVENT_COLOR : style.fill;

    switch (style.shape) {
        case 'triangle':
            // Triangle pointing up
            return (
                <polygon 
                    points={`${cx},${cy - size / 2} ${cx - size / 2},${cy + size / 2} ${cx + size / 2},${cy + size / 2}`} 
                    fill={color} 
                    stroke={color} 
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
                    fill={color} 
                    stroke={color} 
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
                    r={size} 
                    fill={color} 
                    stroke={color} 
                    strokeWidth={1}
                />
            );
    }
};

const CustomLegend = (props: any) => {
    // Define os itens fixos da legenda
    const fixedItems = [
        { value: 'Vendas', color: SALES_COLOR, type: 'line' },
        { value: 'Wishlists (Diário)', color: WL_COLOR, shape: 'circle' },
        { value: 'Wishlists (Semanal)', color: WL_COLOR, shape: 'triangle' },
        { value: 'Wishlists (Mensal)', color: WL_COLOR, shape: 'square' },
        { value: 'WL em Evento', color: EVENT_COLOR, shape: 'circle', size: 6 }, // New item
    ];

    return (
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 p-2 text-sm">
            {fixedItems.map((entry, index) => {
                const style = FREQUENCY_STYLES[entry.shape === 'circle' ? 'Diário' : entry.shape === 'triangle' ? 'Semanal' : 'Mensal'];
                
                // Determine color and size based on event status for WL dots
                const isEventDot = entry.value === 'WL em Evento';
                const color = isEventDot ? EVENT_COLOR : entry.color;
                const size = isEventDot ? 6 : 4;

                return (
                    <li key={`item-${index}`} className="flex items-center space-x-1 cursor-pointer">
                        {entry.value === 'Vendas' ? (
                            <span className="w-4 h-0.5" style={{ backgroundColor: color }}></span>
                        ) : (
                            <svg width="10" height="10" viewBox="0 0 10 10" className="mr-1">
                                {entry.shape === 'circle' && <circle cx="5" cy="5" r={size / 2} fill={color} />}
                                {entry.shape === 'triangle' && <polygon points="5,1 1,9 9,9" fill={color} />}
                                {entry.shape === 'square' && <rect x="1" y="1" width="8" height="8" fill={color} />}
                            </svg>
                        )}
                        <span className="text-muted-foreground">{entry.value}</span>
                    </li>
                );
            })}
        </ul>
    );
};


const WLSalesChartPanel: React.FC<WLSalesChartPanelProps> = ({ data, onPointClick, eventTracking }) => {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Evolução Diária de Wishlists e Vendas</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Nenhum dado de WL/Vendas disponível para esta plataforma/jogo.</p></CardContent>
            </Card>
        );
    }

    // Recharts expects data to be an array of objects with keys for X and Y axes.
    const chartData = data.map(item => ({
        date: item.date ? item.date.getTime() : null, // Use timestamp for sorting/keying
        Wishlists: item.wishlists,
        Vendas: item.sales,
        variation: item.variation,
        frequency: item.frequency, // Pass frequency data
        platform: item.platform, // Pass platform data
    })).filter(item => item.date !== null);

    const handleChartClick = (e: any) => {
        if (e && e.activePayload && e.activePayload.length > 0) {
            const clickedTimestamp = e.activePayload[0].payload.date;
            const originalEntry = data.find(d => d.date?.getTime() === clickedTimestamp);
            if (originalEntry) {
                onPointClick(originalEntry);
            }
        }
    };

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
                        onClick={handleChartClick}
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
                            dot={<CustomDot dataKey="Wishlists" eventTracking={eventTracking} />} // Pass eventTracking here
                            activeDot={{ r: 8, className: 'cursor-pointer' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="Vendas" 
                            stroke={SALES_COLOR}
                            strokeWidth={2}
                            activeDot={{ r: 8, className: 'cursor-pointer' }}
                            dot={false} // Keep sales line simple
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default WLSalesChartPanel;