"use client";

import React from 'react';
import { WLSalesPlatformEntry, EntryFrequency, EventTrackingEntry, ManualEventMarker, Platform } from '@/data/trackingData'; // Import ManualEventMarker and Platform
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
import { formatDate, formatNumber, cn } from '@/lib/utils'; // Import cn
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { startOfDay, isBefore, isEqual } from 'date-fns';

interface WLSalesChartColors {
    daily: string;
    weekly: string;
    monthly: string;
    event: string;
    sales: string;
}

interface WLSalesChartPanelProps {
    data: WLSalesPlatformEntry[];
    onPointClick: (entry: WLSalesPlatformEntry) => void;
    eventTracking: EventTrackingEntry[];
    manualEventMarkers: ManualEventMarker[];
    chartColors: WLSalesChartColors;
    selectedPlatform: Platform | 'All'; // NEW PROP
}

// Helper function to check if a date is within an event period (automatic or manual)
const getActiveEventsForDate = (date: Date | null, events: EventTrackingEntry[], manualMarkers: ManualEventMarker[]): { type: 'auto' | 'manual', name: string, id: string }[] => {
    if (!date) return [];
    const timestamp = startOfDay(date).getTime();
    const activeEvents: { type: 'auto' | 'manual', name: string, id: string }[] = [];

    // 1. Automatic Events (EventTrackingEntry)
    events.forEach(event => {
        const start = event.startDate?.getTime();
        const end = event.endDate?.getTime();
        
        if (start && end) {
            const startDay = startOfDay(event.startDate!).getTime();
            const endDay = startOfDay(event.endDate!).getTime();
            
            if (timestamp >= startDay && timestamp <= endDay) {
                activeEvents.push({ type: 'auto', name: event.event, id: event.id });
            }
        }
    });

    // 2. Manual Markers
    manualMarkers.forEach(marker => {
        if (startOfDay(marker.date).getTime() === timestamp) {
            activeEvents.push({ type: 'manual', name: marker.name, id: marker.id });
        }
    });

    return activeEvents;
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: number; // Timestamp
    eventTracking: EventTrackingEntry[]; 
    manualEventMarkers: ManualEventMarker[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, eventTracking, manualEventMarkers }) => {
    if (active && payload && payload.length && label) {
        const dateLabel = formatDate(label);
        const date = new Date(label);
        
        // Find active events for this date
        const activeEvents = getActiveEventsForDate(date, eventTracking, manualEventMarkers);

        // Group data by platform and frequency for the tooltip
        const dataByPlatform = payload.reduce((acc: Record<string, any[]>, entry: any) => {
            // Ensure we only process data points related to WL or Sales
            if (entry.dataKey === 'Wishlists' || entry.dataKey === 'Vendas') {
                const platform = entry.payload.platform || 'Steam';
                if (!acc[platform]) {
                    acc[platform] = [];
                }
                acc[platform].push(entry);
            }
            return acc;
        }, {});

        return (
            <div className="bg-white/90 dark:bg-gray-800/90 p-3 border rounded-md shadow-lg text-sm backdrop-blur-sm">
                <p className="font-bold mb-2 text-base">{dateLabel}</p>
                
                {/* Display active events */}
                {activeEvents.length > 0 && (
                    <div className="mb-2 p-2 bg-gogo-orange/10 border border-gogo-orange rounded-md">
                        <p className="font-semibold text-gogo-orange text-xs mb-1">Eventos Ativos:</p>
                        {activeEvents.map((event, index) => (
                            <p key={event.id || index} className="text-xs text-foreground">
                                {event.name} ({event.type === 'manual' ? 'Manual' : 'Automático'})
                            </p>
                        ))}
                    </div>
                )}

                {Object.keys(dataByPlatform).sort().map(platform => {
                    const platformData = dataByPlatform[platform];
                    const wlEntry = platformData.find((e: any) => e.dataKey === 'Wishlists')?.payload;
                    const salesEntry = platformData.find((e: any) => e.dataKey === 'Vendas')?.payload;

                    const isPlaceholder = wlEntry?.isPlaceholder;
                    const variation = wlEntry?.variation || 0;
                    const totalWishlists = wlEntry?.Wishlists || 0;
                    // Sales should be 0 if placeholder, or the actual value
                    const totalSales = salesEntry?.Vendas === null ? 0 : salesEntry?.Vendas || 0; 
                    const frequency = wlEntry?.frequency || 'Diário';

                    const VariationIcon = variation > 0 ? ArrowUp : variation < 0 ? ArrowDown : Minus;
                    const variationColor = variation > 0 ? 'text-green-500' : variation < 0 ? 'text-red-500' : 'text-muted-foreground';

                    return (
                        <div key={platform} className="mt-2 border-t pt-2 border-muted-foreground/20">
                            <p className="font-semibold text-sm mb-1 flex items-center justify-between">
                                <span>{platform} ({frequency})</span>
                                <span className="text-xs text-muted-foreground">WL: {formatNumber(totalWishlists)} {isPlaceholder && '(Estimado)'}</span>
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
    const { cx, cy, stroke, payload, dataKey, eventTracking, manualEventMarkers, chartColors } = props;
    
    // Only apply custom dot logic to Wishlists (WL)
    if (dataKey !== 'Wishlists') {
        // Sales dots should only appear if Vendas is not null and not a placeholder
        if (payload.isPlaceholder || payload.Vendas === null) {
            return null;
        }
        return <Dot {...props} r={3} fill={chartColors.sales} stroke={chartColors.sales} />;
    }

    const date = payload.date ? new Date(payload.date) : null;
    const activeEvents = getActiveEventsForDate(date, eventTracking, manualEventMarkers); // Check if date is in an event (auto or manual)
    const isActiveEvent = activeEvents.length > 0;
    const isPlaceholder = payload.isPlaceholder;

    const frequency: EntryFrequency = payload.frequency || 'Diário';
    
    const getStyle = (freq: EntryFrequency) => {
        switch (freq) {
            case 'Semanal': return { fill: chartColors.weekly, stroke: chartColors.weekly, shape: 'triangle' };
            case 'Mensal': return { fill: chartColors.monthly, stroke: chartColors.monthly, shape: 'square' };
            case 'Diário':
            default: return { fill: chartColors.daily, stroke: chartColors.daily, shape: 'circle' };
        }
    };

    const style = getStyle(frequency);

    const size = isActiveEvent ? 6 : 4; // Make event dots slightly larger
    const color = isActiveEvent ? chartColors.event : style.fill;
    const opacity = isPlaceholder ? 0.5 : 1; // Dim placeholder dots

    switch (style.shape) {
        case 'triangle':
            // Triangle pointing up
            return (
                <polygon 
                    points={`${cx},${cy - size / 2} ${cx - size / 2},${cy + size / 2} ${cx + size / 2},${cy + size / 2}`} 
                    fill={color} 
                    stroke={color} 
                    strokeWidth={1}
                    opacity={opacity}
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
                    opacity={opacity}
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
                    opacity={opacity}
                />
            );
    }
};

const CustomLegend = (props: any) => {
    const { chartColors } = props;

    // Define os itens fixos da legenda
    const fixedItems = [
        { value: 'Vendas', color: chartColors.sales, type: 'line' },
        { value: 'WL Diária', color: chartColors.daily, shape: 'circle' },
        { value: 'WL Semanal', color: chartColors.weekly, shape: 'triangle' },
        { value: 'WL Mensal', color: chartColors.monthly, shape: 'square' },
        { value: 'WL em Evento', color: chartColors.event, shape: 'circle', size: 6 },
        { value: 'WL Estimada (Sem Dados)', color: chartColors.daily, shape: 'circle', opacity: 0.5 },
    ];

    return (
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 p-2 text-sm">
            {fixedItems.map((entry, index) => {
                
                // Determine color, size, and opacity
                const isEventDot = entry.value === 'WL em Evento';
                const isPlaceholder = entry.value.includes('Estimada');
                
                const color = isEventDot ? chartColors.event : entry.color;
                const size = isEventDot ? 6 : 4;
                const opacity = isPlaceholder ? 0.5 : 1;

                const renderShape = () => {
                    switch (entry.shape) {
                        case 'circle':
                            return <circle cx="5" cy="5" r={size / 2} fill={color} opacity={opacity} />;
                        case 'triangle':
                            return <polygon points="5,1 1,9 9,9" fill={color} opacity={opacity} />;
                        case 'square':
                            return <rect x="1" y="1" width="8" height="8" fill={color} opacity={opacity} />;
                        default:
                            return null;
                    }
                };

                return (
                    <li key={`item-${index}`} className="flex items-center space-x-1 cursor-pointer">
                        {entry.type === 'line' ? (
                            <span className="w-4 h-0.5" style={{ backgroundColor: color }}></span>
                        ) : (
                            <svg width="10" height="10" viewBox="0 0 10 10" className="mr-1">
                                {renderShape()}
                            </svg>
                        )}
                        <span className="text-muted-foreground">{entry.value}</span>
                    </li>
                );
            })}
        </ul>
    );
};


const WLSalesChartPanel: React.FC<WLSalesChartPanelProps> = ({ data, onPointClick, eventTracking, manualEventMarkers, chartColors, selectedPlatform }) => {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Evolução Diária de Wishlists e Vendas</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Nenhum dado de WL/Vendas disponível para esta plataforma/jogo.</p></CardContent>
            </Card>
        );
    }

    // Determine theme classes for the card
    // Simplificando a verificação de tema, pois as categorias PS foram removidas do filtro principal
    const isPlaystation = selectedPlatform === 'Playstation';
    const isNintendo = selectedPlatform === 'Nintendo';
    
    const cardClasses = cn(
        isPlaystation && "ps-card-glow bg-card border-ps-blue/50",
        isNintendo && "nintendo-card-shadow bg-card border-nintendo-red/50",
        !isPlaystation && !isNintendo && "shadow-md"
    );

    // Recharts expects data to be an array of objects with keys for X and Y axes.
    const chartData = data.map(item => ({
        date: item.date ? item.date.getTime() : null, // Use timestamp for sorting/keying
        Wishlists: item.wishlists,
        // Set Vendas to null if it's a placeholder entry, so the line breaks
        Vendas: item.isPlaceholder ? null : item.sales, 
        variation: item.variation,
        frequency: item.frequency, // Pass frequency data
        platform: item.platform, // Pass platform data
        isPlaceholder: item.isPlaceholder, // Pass placeholder status
    })).filter(item => item.date !== null);

    const handleChartClick = (e: any) => {
        if (e && e.activePayload && e.activePayload.length > 0) {
            const clickedTimestamp = e.activePayload[0].payload.date;
            // Find the original entry (excluding placeholders if possible, but allowing click on placeholders for event info)
            const originalEntry = data.find(d => d.date?.getTime() === clickedTimestamp && !d.isPlaceholder);
            
            if (originalEntry) {
                onPointClick(originalEntry);
            } else {
                // If it's a placeholder, we still want to allow interaction to add a manual marker
                const placeholderEntry = data.find(d => d.date?.getTime() === clickedTimestamp && d.isPlaceholder);
                if (placeholderEntry) {
                    onPointClick(placeholderEntry);
                }
            }
        }
    };

    return (
        <Card className={cardClasses}>
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
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip eventTracking={eventTracking} manualEventMarkers={manualEventMarkers} />} />
                        <Legend content={<CustomLegend chartColors={chartColors} />} />
                        <Line 
                            type="monotone" 
                            dataKey="Wishlists" 
                            stroke={chartColors.daily} // Default stroke color for WL line
                            strokeWidth={2}
                            dot={<CustomDot dataKey="Wishlists" eventTracking={eventTracking} manualEventMarkers={manualEventMarkers} chartColors={chartColors} />}
                            activeDot={{ r: 8, className: 'cursor-pointer' }}
                            connectNulls={true}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="Vendas" 
                            stroke={chartColors.sales}
                            strokeWidth={2}
                            activeDot={{ r: 8, className: 'cursor-pointer' }}
                            dot={<CustomDot dataKey="Vendas" eventTracking={eventTracking} manualEventMarkers={manualEventMarkers} chartColors={chartColors} />}
                            connectNulls={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default WLSalesChartPanel;