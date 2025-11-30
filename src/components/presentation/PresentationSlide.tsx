import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrackingData, WLSalesEntry, InfluencerTrackingEntry, EventTrackingEntry, PaidTrafficEntry, DemoTrackingEntry, WlDetails, ReviewEntry } from '@/data/trackingData';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { DollarSign, List, TrendingUp, Calendar, MessageSquare, Eye, Megaphone, Clock, BarChart3, Info } from 'lucide-react';
import { calculateWlConversionMetrics, calculateDailySummary } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PresentationSlideProps {
    trackingData: TrackingData;
    gameName: string;
    slideType: 'summary' | 'wl_kpis' | 'influencers' | 'events' | 'paid_traffic' | 'demo_reviews';
}

const PresentationSlide: React.FC<PresentationSlideProps> = ({ trackingData, gameName, slideType }) => {
    const wlSalesData = useMemo(() => trackingData.wlSales.filter(e => e.game.trim() === gameName), [trackingData.wlSales, gameName]);
    const wlDetails = useMemo(() => trackingData.wlDetails.find(d => d.game.trim() === gameName), [trackingData.wlDetails, gameName]);
    const influencerData = useMemo(() => trackingData.influencers.filter(e => e.game.trim() === gameName), [trackingData.influencers, gameName]);
    const eventData = useMemo(() => trackingData.events.filter(e => e.game.trim() === gameName), [trackingData.events, gameName]);
    const paidTrafficData = useMemo(() => trackingData.paidTraffic.filter(e => e.game.trim() === gameName), [trackingData.paidTraffic, gameName]);
    const demoTrackingData = useMemo(() => trackingData.demoTracking.filter(e => e.game.trim() === gameName), [trackingData.demoTracking, gameName]);
    const manualEvents = useMemo(() => trackingData.manualEvents.filter(e => e.game.trim() === gameName), [trackingData.manualEvents, gameName]);

    const {
        totalWishlists,
        totalSales,
        conversionRate,
        wlToSalesRatio,
        avgDailyGrowth,
        totalRevenue,
    } = useMemo(() => calculateWlConversionMetrics(wlSalesData), [wlSalesData]);

    const dailySummary = useMemo(() => calculateDailySummary(wlSalesData, manualEvents), [wlSalesData, manualEvents]);

    const renderDemoReviewsSlide = () => {
        const latestDemo = demoTrackingData.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0];
        const latestReview = wlDetails?.reviews.sort((a: any, b: any) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0];

        const demoConversion = latestDemo ? (latestDemo.sales / latestDemo.downloads) * 100 : 0;
        const reviewScore = latestReview?.score || 'N/A';

        return (
            <div className="p-8 h-full flex flex-col">
                <h2 className="text-4xl font-bold text-gogo-orange mb-8 flex items-center">
                    <MessageSquare className="h-8 w-8 mr-3" /> Demo & Reviews
                </h2>
                <div className="grid grid-cols-2 gap-8 flex-grow">
                    <Card className="p-6 shadow-xl border-l-4 border-gogo-cyan">
                        <CardTitle className="text-2xl mb-4 flex items-center text-gogo-cyan">
                            <Eye className="h-6 w-6 mr-2" /> Performance da Demo
                        </CardTitle>
                        <CardContent className="space-y-4 p-0">
                            <p className="text-lg">Downloads: <span className="font-bold text-2xl block">{formatNumber(latestDemo?.downloads)}</span></p>
                            <p className="text-lg">Vendas (Demo): <span className="font-bold text-2xl block text-gogo-green">{formatNumber(latestDemo?.sales)}</span></p>
                            <p className="text-lg">Conversão Demo/Vendas: <span className="font-bold text-2xl block">{demoConversion.toFixed(2)}%</span></p>
                        </CardContent>
                    </Card>

                    <Card className="p-6 shadow-xl border-l-4 border-gogo-orange">
                        <CardTitle className="text-2xl mb-4 flex items-center text-gogo-orange">
                            <MessageSquare className="h-6 w-6 mr-2" /> Última Review
                        </CardTitle>
                        <CardContent className="space-y-4 p-0">
                            <p className="text-lg">Plataforma: <span className="font-bold text-2xl block">{latestReview?.platform || 'N/A'}</span></p>
                            <p className="text-lg">Score: <span className={cn("font-bold text-2xl block", reviewScore >= 80 ? 'text-gogo-green' : reviewScore >= 50 ? 'text-gogo-orange' : 'text-red-500')}>{reviewScore}%</span></p>
                            <p className="text-lg">Data: <span className="font-bold text-2xl block">{formatDate(latestReview?.date)}</span></p>
                            <p className="text-lg mt-4">Resumo: <span className="font-normal text-xl block italic text-gray-600">"{latestReview?.summary || 'N/A'}"</span></p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    const renderSummarySlide = () => (
        <div className="p-8 h-full flex flex-col">
            <h2 className="text-4xl font-bold text-gogo-cyan mb-8 flex items-center">
                <BarChart3 className="h-8 w-8 mr-3" /> Resumo Geral ({gameName})
            </h2>
            <div className="grid grid-cols-3 gap-6 flex-grow">
                <Card className="p-6 shadow-xl border-l-4 border-gogo-green">
                    <CardTitle className="text-2xl mb-4 flex items-center text-gogo-green">
                        <DollarSign className="h-6 w-6 mr-2" /> Vendas
                    </CardTitle>
                    <CardContent className="p-0">
                        <p className="text-lg">Total Vendas: <span className="font-bold text-3xl block">{formatNumber(totalSales)}</span></p>
                        <p className="text-lg mt-2">Receita Estimada: <span className="font-bold text-3xl block">{formatCurrency(totalRevenue)}</span></p>
                    </CardContent>
                </Card>
                <Card className="p-6 shadow-xl border-l-4 border-gogo-cyan">
                    <CardTitle className="text-2xl mb-4 flex items-center text-gogo-cyan">
                        <List className="h-6 w-6 mr-2" /> Wishlists
                    </CardTitle>
                    <CardContent className="p-0">
                        <p className="text-lg">Total Wishlists: <span className="font-bold text-3xl block">{formatNumber(totalWishlists)}</span></p>
                        <p className="text-lg mt-2">Crescimento Diário Médio: <span className="font-bold text-3xl block">{formatNumber(avgDailyGrowth.toFixed(0))}</span></p>
                    </CardContent>
                </Card>
                <Card className="p-6 shadow-xl border-l-4 border-gogo-orange">
                    <CardTitle className="text-2xl mb-4 flex items-center text-gogo-orange">
                        <TrendingUp className="h-6 w-6 mr-2" /> Conversão
                    </CardTitle>
                    <CardContent className="p-0">
                        <p className="text-lg">Taxa de Conversão: <span className="font-bold text-3xl block">{(conversionRate * 100).toFixed(2)}%</span></p>
                        <p className="text-lg mt-2">WL por Venda: <span className="font-bold text-3xl block">{formatNumber(wlToSalesRatio)}</span></p>
                    </CardContent>
                </Card>
            </div>
            <div className="mt-8">
                <h3 className="text-2xl font-semibold mb-4 text-gray-700">Eventos Chave Recentes</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Data</TableHead>
                            <TableHead className="w-[150px]">Tipo</TableHead>
                            <TableHead>Descrição</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {manualEvents.slice(0, 3).map(event => (
                            <TableRow key={event.id}>
                                <TableCell>{formatDate(event.date)}</TableCell>
                                <TableCell className="font-medium">{event.type}</TableCell>
                                <TableCell>{event.description}</TableCell>
                            </TableRow>
                        ))}
                        {manualEvents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-gray-500">Nenhum evento chave registrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    const renderWlKpisSlide = () => (
        <div className="p-8 h-full flex flex-col">
            <h2 className="text-4xl font-bold text-gogo-cyan mb-8 flex items-center">
                <TrendingUp className="h-8 w-8 mr-3" /> KPIs de Wishlist e Vendas
            </h2>
            <div className="grid grid-cols-2 gap-6 flex-grow">
                <Card className="p-6 shadow-xl border-l-4 border-gogo-cyan">
                    <CardTitle className="text-2xl mb-4 flex items-center text-gogo-cyan">
                        <List className="h-6 w-6 mr-2" /> Wishlists
                    </CardTitle>
                    <CardContent className="p-0 space-y-4">
                        <p className="text-lg">Total Wishlists: <span className="font-bold text-3xl block">{formatNumber(totalWishlists)}</span></p>
                        <p className="text-lg">Crescimento Diário Médio: <span className="font-bold text-3xl block">{formatNumber(avgDailyGrowth.toFixed(0))}</span></p>
                    </CardContent>
                </Card>
                <Card className="p-6 shadow-xl border-l-4 border-gogo-green">
                    <CardTitle className="text-2xl mb-4 flex items-center text-gogo-green">
                        <DollarSign className="h-6 w-6 mr-2" /> Vendas e Receita
                    </CardTitle>
                    <CardContent className="p-0 space-y-4">
                        <p className="text-lg">Total Vendas: <span className="font-bold text-3xl block">{formatNumber(totalSales)}</span></p>
                        <p className="text-lg">Receita Estimada: <span className="font-bold text-3xl block">{formatCurrency(totalRevenue)}</span></p>
                    </CardContent>
                </Card>
                <Card className="p-6 shadow-xl border-l-4 border-gogo-orange col-span-2">
                    <CardTitle className="text-2xl mb-4 flex items-center text-gogo-orange">
                        <TrendingUp className="h-6 w-6 mr-2" /> Conversão
                    </CardTitle>
                    <CardContent className="p-0 grid grid-cols-2 gap-4">
                        <p className="text-lg">Taxa de Conversão: <span className="font-bold text-3xl block">{(conversionRate * 100).toFixed(2)}%</span></p>
                        <p className="text-lg">WL por Venda: <span className="font-bold text-3xl block">{formatNumber(wlToSalesRatio)}</span></p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderInfluencersSlide = () => (
        <div className="p-8 h-full flex flex-col">
            <h2 className="text-4xl font-bold text-gogo-orange mb-8 flex items-center">
                <Megaphone className="h-8 w-8 mr-3" /> Performance de Influencers
            </h2>
            <div className="flex-grow overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Data</TableHead>
                            <TableHead>Influencer</TableHead>
                            <TableHead>Plataforma</TableHead>
                            <TableHead className="text-right">Views</TableHead>
                            <TableHead className="text-right">WLs</TableHead>
                            <TableHead className="text-right">Vendas</TableHead>
                            <TableHead className="text-right">Custo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {influencerData.length > 0 ? (
                            influencerData.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{formatDate(entry.date)}</TableCell>
                                    <TableCell className="font-medium">{entry.influencer}</TableCell>
                                    <TableCell>{entry.platform}</TableCell>
                                    <TableCell className="text-right">{formatNumber(entry.views)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(entry.wishlists)}</TableCell>
                                    <TableCell className="text-right text-gogo-green">{formatNumber(entry.sales)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(entry.cost)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                                    Nenhum dado de Influencer encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    const renderEventsSlide = () => (
        <div className="p-8 h-full flex flex-col">
            <h2 className="text-4xl font-bold text-gogo-cyan mb-8 flex items-center">
                <Calendar className="h-8 w-8 mr-3" /> Performance de Eventos
            </h2>
            <div className="flex-grow overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Data</TableHead>
                            <TableHead>Evento</TableHead>
                            <TableHead>Plataforma</TableHead>
                            <TableHead className="text-right">WLs</TableHead>
                            <TableHead className="text-right">Vendas</TableHead>
                            <TableHead className="text-right">Custo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {eventData.length > 0 ? (
                            eventData.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{formatDate(entry.date)}</TableCell>
                                    <TableCell className="font-medium">{entry.event}</TableCell>
                                    <TableCell>{entry.platform}</TableCell>
                                    <TableCell className="text-right">{formatNumber(entry.wishlists)}</TableCell>
                                    <TableCell className="text-right text-gogo-green">{formatNumber(entry.sales)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(entry.cost)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                    Nenhum dado de Evento encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    const renderPaidTrafficSlide = () => (
        <div className="p-8 h-full flex flex-col">
            <h2 className="text-4xl font-bold text-gogo-orange mb-8 flex items-center">
                <DollarSign className="h-8 w-8 mr-3" /> Performance de Tráfego Pago
            </h2>
            <div className="flex-grow overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Data</TableHead>
                            <TableHead>Rede</TableHead>
                            <TableHead>Plataforma</TableHead>
                            <TableHead className="text-right">Cliques</TableHead>
                            <TableHead className="text-right">WLs</TableHead>
                            <TableHead className="text-right">Custo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paidTrafficData.length > 0 ? (
                            paidTrafficData.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{formatDate(entry.date)}</TableCell>
                                    <TableCell className="font-medium">{entry.network}</TableCell>
                                    <TableCell>{entry.platform}</TableCell>
                                    <TableCell className="text-right">{formatNumber(entry.clicks)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(entry.wishlists)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(entry.cost)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                    Nenhum dado de Tráfego Pago encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    switch (slideType) {
        case 'summary':
            return renderSummarySlide();
        case 'wl_kpis':
            return renderWlKpisSlide();
        case 'influencers':
            return renderInfluencersSlide();
        case 'events':
            return renderEventsSlide();
        case 'paid_traffic':
            return renderPaidTrafficSlide();
        case 'demo_reviews':
            return renderDemoReviewsSlide();
        default:
            return <div className="p-8 text-center text-xl text-red-500">Slide Type Not Found</div>;
    }
};

export default PresentationSlide;