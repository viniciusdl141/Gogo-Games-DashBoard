"use client";

import React, { useMemo } from 'react';
import { WLSalesPlatformEntry, InfluencerTrackingEntry, EventTrackingEntry, PaidTrafficEntry, DemoTrackingEntry, ManualEventMarker } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils';
import { startOfDay, isBefore, isEqual } from 'date-fns';
import { List, DollarSign, Eye, Megaphone, Download, CalendarDays, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import PlatformIcon from './PlatformIcon'; // Import PlatformIcon

interface DailySummaryPanelProps {
    date: Date;
    gameName: string;
    wlSales: WLSalesPlatformEntry[];
    influencerTracking: InfluencerTrackingEntry[];
    eventTracking: EventTrackingEntry[];
    paidTraffic: PaidTrafficEntry[];
    demoTracking: DemoTrackingEntry[];
    manualEventMarkers: ManualEventMarker[];
}

const DailySummaryPanel: React.FC<DailySummaryPanelProps> = ({
    date,
    gameName,
    wlSales,
    influencerTracking,
    eventTracking,
    paidTraffic,
    demoTracking,
    manualEventMarkers,
}) => {
    const targetTimestamp = startOfDay(date).getTime();

    const filteredData = useMemo(() => {
        // 1. WL/Sales (only real entries for this date)
        const dailyWLSales = wlSales.filter(e => 
            e.date && startOfDay(e.date).getTime() === targetTimestamp && !e.isPlaceholder
        );

        // 2. Influencers (entries that occurred on this date)
        const dailyInfluencers = influencerTracking.filter(e => 
            e.date && startOfDay(e.date).getTime() === targetTimestamp
        );

        // 3. Events (events active on this date)
        const activeEvents = eventTracking.filter(e => {
            if (!e.startDate || !e.endDate) return false;
            const start = startOfDay(e.startDate).getTime();
            const end = startOfDay(e.endDate).getTime();
            return targetTimestamp >= start && targetTimestamp <= end;
        });

        // 4. Paid Traffic (campaigns active on this date)
        const activePaidTraffic = paidTraffic.filter(e => {
            if (!e.startDate || !e.endDate) return false;
            const start = startOfDay(e.startDate).getTime();
            const end = startOfDay(e.endDate).getTime();
            return targetTimestamp >= start && targetTimestamp <= end;
        });

        // 5. Demo Tracking (entries recorded on this date)
        const dailyDemo = demoTracking.filter(e => 
            e.date && startOfDay(e.date).getTime() === targetTimestamp
        );

        // 6. Manual Markers
        const dailyMarkers = manualEventMarkers.filter(m => 
            startOfDay(m.date).getTime() === targetTimestamp
        );

        return {
            dailyWLSales,
            dailyInfluencers,
            activeEvents,
            activePaidTraffic,
            dailyDemo,
            dailyMarkers,
        };
    }, [date, wlSales, influencerTracking, eventTracking, paidTraffic, demoTracking, manualEventMarkers, targetTimestamp]);

    const { dailyWLSales, dailyInfluencers, activeEvents, activePaidTraffic, dailyDemo, dailyMarkers } = filteredData;

    const totalSales = dailyWLSales.reduce((sum, e) => sum + e.sales, 0);
    const totalInvestment = dailyInfluencers.reduce((sum, e) => sum + e.investment, 0) + 
                            activeEvents.reduce((sum, e) => sum + e.cost, 0) + 
                            activePaidTraffic.reduce((sum, e) => sum + e.investedValue, 0);

    const hasData = dailyWLSales.length > 0 || dailyInfluencers.length > 0 || activeEvents.length > 0 || activePaidTraffic.length > 0 || dailyDemo.length > 0 || dailyMarkers.length > 0;

    if (!hasData) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Nenhum dado de tracking registrado para {formatDate(date)}.
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4">
            <h3 className="text-xl font-bold text-gogo-cyan flex items-center">
                <CalendarDays className="h-5 w-5 mr-2" /> Resumo Diário: {formatDate(date)}
            </h3>
            <p className="text-sm text-muted-foreground">Detalhes de todas as atividades de marketing e vendas registradas para {gameName} nesta data.</p>
            
            <Separator />

            {/* KPIs de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Vendas (Unidades)</CardTitle>
                        <List className="h-4 w-4 text-gogo-cyan" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold">{formatNumber(totalSales)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Investimento (R$)</CardTitle>
                        <DollarSign className="h-4 w-4 text-gogo-orange" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold">{formatCurrency(totalInvestment)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">WL Totais (Último Reg.)</CardTitle>
                        <List className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold">
                            {dailyWLSales.length > 0 ? formatNumber(dailyWLSales[dailyWLSales.length - 1].wishlists) : '-'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Marcadores</CardTitle>
                        <CalendarDays className="h-4 w-4 text-gogo-orange" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold">{dailyMarkers.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Manual Markers */}
            {dailyMarkers.length > 0 && (
                <Card className="border-gogo-orange/50 bg-gogo-orange/5">
                    <CardHeader className="p-4">
                        <CardTitle className="text-md font-semibold text-gogo-orange flex items-center">
                            <CalendarDays className="h-4 w-4 mr-2" /> Marcadores Manuais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                        {dailyMarkers.map(m => (
                            <Badge key={m.id} variant="default" className="bg-gogo-orange hover:bg-gogo-orange/90 text-white">
                                {m.name}
                            </Badge>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* WL/Sales Details */}
            {dailyWLSales.length > 0 && (
                <Card>
                    <CardHeader className="p-4">
                        <CardTitle className="text-md font-semibold flex items-center">
                            <List className="h-4 w-4 mr-2" /> Wishlists & Vendas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plataforma</TableHead>
                                    <TableHead className="text-right">WL Totais</TableHead>
                                    <TableHead className="text-right">Variação Diária</TableHead>
                                    <TableHead className="text-right">Vendas (Unidades)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyWLSales.map(e => (
                                    <TableRow key={e.id}>
                                        <TableCell className="flex items-center space-x-2">
                                            <PlatformIcon platform={e.platform} className="h-4 w-4" />
                                            <span>{e.platform}</span>
                                        </TableCell>
                                        <TableCell className="text-right">{formatNumber(e.wishlists)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(e.variation)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(e.sales)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Influencer Details */}
            {dailyInfluencers.length > 0 && (
                <Card>
                    <CardHeader className="p-4">
                        <CardTitle className="text-md font-semibold flex items-center">
                            <Megaphone className="h-4 w-4 mr-2" /> Ações de Influencers
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Influencer</TableHead>
                                    <TableHead>Plataforma</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead className="text-right">Views</TableHead>
                                    <TableHead className="text-right">Investimento</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyInfluencers.map(e => (
                                    <TableRow key={e.id}>
                                        <TableCell>{e.influencer}</TableCell>
                                        <TableCell>{e.platform}</TableCell>
                                        <TableCell>{e.action}</TableCell>
                                        <TableCell className="text-right">{formatNumber(e.views)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(e.investment)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Active Events Details */}
            {activeEvents.length > 0 && (
                <Card>
                    <CardHeader className="p-4">
                        <CardTitle className="text-md font-semibold flex items-center">
                            <CalendarDays className="h-4 w-4 mr-2" /> Eventos Ativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Evento</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead className="text-right">Custo</TableHead>
                                    <TableHead className="text-right">WL Geradas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeEvents.map(e => (
                                    <TableRow key={e.id}>
                                        <TableCell>{e.event}</TableCell>
                                        <TableCell>{formatDate(e.startDate)} - {formatDate(e.endDate)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(e.cost)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(e.wlGenerated)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Paid Traffic Details */}
            {activePaidTraffic.length > 0 && (
                <Card>
                    <CardHeader className="p-4">
                        <CardTitle className="text-md font-semibold flex items-center">
                            <Eye className="h-4 w-4 mr-2" /> Campanhas de Tráfego Pago Ativas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rede</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead className="text-right">Investido</TableHead>
                                    <TableHead className="text-right">Impressões</TableHead>
                                    <TableHead className="text-right">Cliques</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activePaidTraffic.map(e => (
                                    <TableRow key={e.id}>
                                        <TableCell>{e.network}</TableCell>
                                        <TableCell>{formatDate(e.startDate)} - {formatDate(e.endDate)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(e.investedValue)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(e.impressions)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(e.clicks)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Demo Tracking Details */}
            {dailyDemo.length > 0 && (
                <Card>
                    <CardHeader className="p-4">
                        <CardTitle className="text-md font-semibold flex items-center">
                            <Clock className="h-4 w-4 mr-2" /> Tracking da Demo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">Downloads</TableHead>
                                    <TableHead>Tempo Médio Jogo Demo</TableHead>
                                    <TableHead>Tempo Total Demo</TableHead>
                                    <TableHead>Tempo Total Jogo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyDemo.map(e => (
                                    <TableRow key={e.id}>
                                        <TableCell className="text-right">{formatNumber(e.downloads)}</TableCell>
                                        <TableCell>{e.avgPlaytime}</TableCell>
                                        <TableCell>{e.totalDemoTime}</TableCell>
                                        <TableCell>{e.totalGameTime}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default DailySummaryPanel;