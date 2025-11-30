"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { WLSalesPlatformEntry, InfluencerTrackingEntry, EventTrackingEntry, PaidTrafficEntry, DemoTrackingEntry, TrafficEntry, ManualEventMarker } from '@/data/trackingData';
import { List, Megaphone, CalendarDays, Eye, Clock, Globe } from 'lucide-react';

interface AIDataPreviewProps {
    data: {
        influencerTracking: InfluencerTrackingEntry[];
        eventTracking: EventTrackingEntry[];
        paidTraffic: PaidTrafficEntry[];
        wlSales: WLSalesPlatformEntry[];
        demoTracking: DemoTrackingEntry[];
        trafficTracking: TrafficEntry[];
        manualEventMarkers: ManualEventMarker[];
    };
}

const renderTable = (title: string, icon: React.ReactNode, entries: any[], columns: { key: string, header: string, format?: (value: any) => string }[]) => {
    if (entries.length === 0) return null;

    return (
        <Card className="mt-4">
            <CardHeader className="p-4">
                <CardTitle className="text-md font-semibold flex items-center">
                    {icon} <span className="ml-2">{title} ({entries.length} entradas)</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map(col => (
                                    <TableHead key={col.key}>{col.header}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry, index) => (
                                <TableRow key={index}>
                                    {columns.map(col => (
                                        <TableCell key={col.key}>
                                            {col.format ? col.format(entry[col.key]) : entry[col.key]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

const AIDataPreview: React.FC<AIDataPreviewProps> = ({ data }) => {
    const { influencerTracking, eventTracking, paidTraffic, wlSales, demoTracking, trafficTracking, manualEventMarkers } = data;

    const hasData = Object.values(data).some(arr => arr.length > 0);

    if (!hasData) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                A IA não conseguiu extrair dados estruturados válidos. Por favor, revise o texto de entrada.
            </div>
        );
    }

    return (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto p-4">
            <h3 className="text-xl font-bold text-gogo-orange">Pré-visualização dos Dados Processados</h3>
            <p className="text-sm text-muted-foreground">Revise as entradas abaixo antes de confirmar a inserção no dashboard.</p>

            {renderTable(
                "Wishlists e Vendas",
                <List className="h-4 w-4 text-gogo-cyan" />,
                wlSales,
                [
                    { key: 'date', header: 'Data', format: (d) => formatDate(new Date(d)) },
                    { key: 'platform', header: 'Plataforma' },
                    { key: 'wishlists', header: 'WL', format: formatNumber },
                    { key: 'sales', header: 'Vendas', format: formatNumber },
                    { key: 'saleType', header: 'Tipo' },
                ]
            )}

            {renderTable(
                "Tracking de Influencers",
                <Megaphone className="h-4 w-4 text-gogo-orange" />,
                influencerTracking,
                [
                    { key: 'date', header: 'Data', format: (d) => formatDate(new Date(d)) },
                    { key: 'influencer', header: 'Influencer' },
                    { key: 'platform', header: 'Plataforma' },
                    { key: 'views', header: 'Views', format: formatNumber },
                    { key: 'investment', header: 'Investimento', format: formatCurrency },
                ]
            )}

            {renderTable(
                "Tracking de Eventos",
                <CalendarDays className="h-4 w-4 text-gogo-cyan" />,
                eventTracking,
                [
                    { key: 'event', header: 'Evento' },
                    { key: 'startDate', header: 'Início', format: (d) => formatDate(new Date(d)) },
                    { key: 'endDate', header: 'Fim', format: (d) => formatDate(new Date(d)) },
                    { key: 'cost', header: 'Custo', format: formatCurrency },
                    { key: 'wlGenerated', header: 'WL Geradas', format: formatNumber },
                ]
            )}

            {renderTable(
                "Tráfego Pago",
                <Eye className="h-4 w-4 text-gogo-orange" />,
                paidTraffic,
                [
                    { key: 'network', header: 'Rede' },
                    { key: 'startDate', header: 'Início', format: (d) => formatDate(new Date(d)) },
                    { key: 'impressions', header: 'Impressões', format: formatNumber },
                    { key: 'investedValue', header: 'Investido', format: formatCurrency },
                    { key: 'estimatedWishlists', header: 'WL Est.', format: formatNumber },
                ]
            )}
            
            {renderTable(
                "Tracking de Demo",
                <Clock className="h-4 w-4 text-gogo-cyan" />,
                demoTracking,
                [
                    { key: 'date', header: 'Data', format: (d) => formatDate(new Date(d)) },
                    { key: 'downloads', header: 'Downloads', format: formatNumber },
                    { key: 'avgPlaytime', header: 'Tempo Médio' },
                    { key: 'totalGameTime', header: 'Tempo Total Jogo' },
                ]
            )}

            {renderTable(
                "Tráfego/Visitas Manuais",
                <Globe className="h-4 w-4 text-gogo-orange" />,
                trafficTracking,
                [
                    { key: 'source', header: 'Fonte' },
                    { key: 'platform', header: 'Plataforma' },
                    { key: 'visits', header: 'Visitas', format: formatNumber },
                    { key: 'startDate', header: 'Início', format: (d) => formatDate(new Date(d)) },
                ]
            )}

            {renderTable(
                "Marcadores Manuais",
                <CalendarDays className="h-4 w-4 text-gogo-cyan" />,
                manualEventMarkers,
                [
                    { key: 'date', header: 'Data', format: (d) => formatDate(new Date(d)) },
                    { key: 'name', header: 'Nome do Marcador' },
                ]
            )}
        </div>
    );
};

export default AIDataPreview;