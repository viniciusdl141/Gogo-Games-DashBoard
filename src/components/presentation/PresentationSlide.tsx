"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Game as SupabaseGame } from '@/integrations/supabase/games';
import { TrackingData } from '@/data/trackingData';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { DollarSign, List, TrendingUp, Calendar, MessageSquare, Eye, Megaphone, Clock, BarChart3, Info } from 'lucide-react';
import KpiCard from '../dashboard/KpiCard';
import GameCapsule from '../dashboard/GameCapsule';
import LaunchTimer from '../dashboard/LaunchTimer';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { GameMetrics } from '@/hooks/useGameMetrics'; // NEW IMPORT

interface PresentationSlideProps {
    slideId: string;
    slideTitle: string;
    gameData: GameMetrics; // Use the centralized metrics type
    allGames: SupabaseGame[];
    trackingData: TrackingData;
}

// Helper function to format values based on key (moved outside render function)
const formatValue = (key: string, value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '' || value === '#DIV/0!' || (typeof value === 'number' && isNaN(value))) return '-';
    const numValue = Number(value);
    if (key.includes('Real') || key.includes('Custo')) return formatCurrency(numValue);
    return String(value);
};


const PresentationSlide: React.FC<PresentationSlideProps> = ({ slideId, slideTitle, gameData, allGames, trackingData }) => {
    const { 
        gameName, totalSales, totalWishlists, totalInvestment, launchDate, capsuleImageUrl, category,
        wlSales, influencerTracking, eventTracking, paidTraffic, resultSummary, wlDetails, investmentSources, influencerSummary
    } = gameData;

    // --- Slide Content Renderers ---

    const renderIntroSlide = () => {
        return (
            <div className="space-y-8">
                <div className="flex items-center space-x-6">
                    <GameCapsule imageUrl={capsuleImageUrl} gameName={gameName} className="w-48 h-20 flex-shrink-0" />
                    <div>
                        <h2 className="text-4xl font-bold text-gogo-cyan">{gameName}</h2>
                        {category && <Badge className="mt-2 text-lg bg-gogo-orange">{category}</Badge>}
                    </div>
                </div>
                
                <Separator />

                {launchDate && <LaunchTimer launchDate={launchDate} />}

                <div className="grid gap-6 md:grid-cols-3">
                    <KpiCard 
                        title="Vendas Totais (Unidades)" 
                        value={formatNumber(totalSales)} 
                        icon={<TrendingUp className="h-6 w-6 text-gogo-orange" />} 
                    />
                    <KpiCard 
                        title="Wishlists Totais" 
                        value={formatNumber(totalWishlists)} 
                        icon={<List className="h-6 w-6 text-gogo-cyan" />} 
                    />
                    <KpiCard 
                        title="Investimento Total (R$)" 
                        value={formatCurrency(totalInvestment)} 
                        icon={<DollarSign className="h-6 w-6 text-gogo-orange" />} 
                        description={`Influencers: ${formatCurrency(investmentSources.influencers)} | Eventos: ${formatCurrency(investmentSources.events)} | Tráfego Pago: ${formatCurrency(investmentSources.paidTraffic)}`}
                    />
                </div>
            </div>
        );
    };

    const renderWLSalesSlide = () => {
        const chartData = wlSales
            .filter(e => !e.isPlaceholder)
            .map(item => ({
                date: item.date ? item.date.getTime() : null,
                Wishlists: item.wishlists,
                Vendas: item.sales,
            }))
            .filter(item => item.date !== null)
            .sort((a, b) => a.date! - b.date!);

        return (
            <div className="space-y-6 h-full flex flex-col">
                <h3 className="text-2xl font-bold text-gogo-orange">Evolução Diária de Wishlists e Vendas (Steam)</h3>
                <div className="flex-grow h-[calc(100%-100px)]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={(tick) => formatDate(tick)} 
                                minTickGap={30}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis yAxisId="left" stroke="#00BFFF" tickFormatter={formatNumber} />
                            <YAxis yAxisId="right" orientation="right" stroke="#FF6600" tickFormatter={formatNumber} />
                            <Tooltip formatter={(value, name) => [formatNumber(value as number), name]} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="Wishlists" stroke="#00BFFF" strokeWidth={3} dot={false} />
                            <Line yAxisId="right" type="monotone" dataKey="Vendas" stroke="#FF6600" strokeWidth={3} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const renderMarketingSummarySlide = () => {
        const summaryData = resultSummary.map(r => ({
            type: r.type,
            'WL/Real': Number(r['WL/Real']) || 0,
            'Real/WL': Number(formatValue('Real/WL', r['Real/WL']).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
            'Custo por venda': Number(formatValue('Custo por venda', r['Custo por venda']).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
        }));

        return (
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gogo-orange">Resumo de Performance de Marketing</h3>
                <Card>
                    <CardHeader><CardTitle className="text-xl">KPIs de Custo por Wishlist e Venda</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Tipo de Campanha</th>
                                        <th className="text-center p-2">WL / R$</th>
                                        <th className="text-center p-2">R$ / WL</th>
                                        <th className="text-center p-2">Custo por Venda</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultSummary.map((r, index) => (
                                        <tr key={index} className="border-b last:border-b-0">
                                            <td className="font-medium p-2">{r.type}</td>
                                            <td className="text-center p-2">{formatValue('WL/Real', r['WL/Real'])}</td>
                                            <td className="text-center p-2">{formatValue('Real/WL', r['Real/WL'])}</td>
                                            <td className="text-center p-2">{formatValue('Custo por venda', r['Custo por venda'])}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle className="text-xl">Comparativo de Investimento (R$)</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summaryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="type" />
                                <YAxis yAxisId="left" stroke="#FF6600" tickFormatter={(value) => formatCurrency(value)} />
                                <Tooltip formatter={(value, name) => [formatCurrency(value as number), name]} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="Real/WL" fill="#FF6600" name="Custo por WL (R$)" />
                                <Bar yAxisId="left" dataKey="Custo por venda" fill="#00BFFF" name="Custo por Venda (R$)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderInfluencersSlide = () => {
        const chartData = influencerSummary.map(item => ({
            influencer: item.influencer,
            Investimento: item.totalInvestment,
            Wishlists: item.wishlistsGenerated,
        }));

        return (
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gogo-orange">Performance de Influencers</h3>
                <Card>
                    <CardHeader><CardTitle className="text-xl">Investimento vs. Wishlists Geradas</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="influencer" angle={-15} textAnchor="end" height={50} />
                                <YAxis yAxisId="left" orientation="left" stroke="#FF6600" tickFormatter={(value) => formatCurrency(value)} />
                                <YAxis yAxisId="right" orientation="right" stroke="#00BFFF" tickFormatter={formatNumber} />
                                <Tooltip formatter={(value, name) => [name === 'Investimento' ? formatCurrency(value as number) : formatNumber(value as number), name]} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="Investimento" fill="#FF6600" />
                                <Bar yAxisId="right" dataKey="Wishlists" fill="#00BFFF" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle className="text-xl">Top Influencers por ROI</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Influencer</th>
                                        <th className="text-center p-2">Ações</th>
                                        <th className="text-right p-2">Investimento (R$)</th>
                                        <th className="text-right p-2">ROI Médio (R$/WL)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {influencerSummary.sort((a, b) => {
                                        const roiA = typeof a.avgROI === 'number' ? a.avgROI : Infinity;
                                        const roiB = typeof b.avgROI === 'number' ? b.avgROI : Infinity;
                                        return roiA - roiB;
                                    }).slice(0, 5).map((item, index) => (
                                        <tr key={index} className="border-b last:border-b-0">
                                            <td className="font-medium p-2">{item.influencer}</td>
                                            <td className="text-center p-2">{item.totalActions}</td>
                                            <td className="text-right p-2">{formatCurrency(item.totalInvestment)}</td>
                                            <td className="text-right p-2 text-gogo-cyan font-bold">{typeof item.avgROI === 'number' ? formatCurrency(item.avgROI) : item.avgROI}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderPaidTrafficSlide = () => {
        const totalImpressions = paidTraffic.reduce((sum, item) => sum + item.impressions, 0);
        const totalClicks = paidTraffic.reduce((sum, item) => sum + item.clicks, 0);
        const totalInvested = paidTraffic.reduce((sum, item) => sum + item.investedValue, 0);
        const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
        // const avgCostPerWL = paidTraffic.filter(p => typeof p.estimatedCostPerWL === 'number').reduce((sum, p) => sum + (p.estimatedCostPerWL as number), 0) / paidTraffic.length;

        const networkSummary = paidTraffic.reduce((acc, item) => {
            const network = item.network;
            if (!acc[network]) {
                acc[network] = { invested: 0, estimatedWL: 0 };
            }
            acc[network].invested += item.investedValue;
            acc[network].estimatedWL += item.estimatedWishlists;
            return acc;
        }, {} as Record<string, { invested: number, estimatedWL: number }>);

        const chartData = Object.entries(networkSummary).map(([network, data]) => ({
            network,
            Investido: data.invested,
            'WL Estimadas': data.estimatedWL,
        }));

        return (
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gogo-orange">Performance de Tráfego Pago</h3>
                
                <div className="grid gap-6 md:grid-cols-3">
                    <KpiCard 
                        title="Investimento Total (R$)" 
                        value={formatCurrency(totalInvested)} 
                        icon={<DollarSign className="h-6 w-6 text-gogo-cyan" />} 
                    />
                    <KpiCard 
                        title="Impressões Totais" 
                        value={formatNumber(totalImpressions)} 
                        icon={<Eye className="h-6 w-6 text-gogo-orange" />} 
                    />
                    <KpiCard 
                        title="CTR Médio" 
                        value={`${(avgCTR * 100).toFixed(2)}%`} 
                        icon={<TrendingUp className="h-6 w-6 text-gogo-cyan" />} 
                    />
                </div>

                <Card>
                    <CardHeader><CardTitle className="text-xl">Comparativo por Rede</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="network" angle={-15} textAnchor="end" height={50} />
                                <YAxis yAxisId="left" orientation="left" stroke="#FF6600" tickFormatter={(value) => formatCurrency(value)} />
                                <YAxis yAxisId="right" orientation="right" stroke="#00BFFF" tickFormatter={formatNumber} />
                                <Tooltip formatter={(value, name) => [name === 'Investido' ? formatCurrency(value as number) : formatNumber(value as number), name]} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="Investido" fill="#FF6600" />
                                <Bar yAxisId="right" dataKey="WL Estimadas" fill="#00BFFF" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderDemoReviewsSlide = () => {
        const latestDemo = demoTracking.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0];
        const latestReview = wlDetails?.reviews.sort((a: any, b: any) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0];

        return (
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gogo-orange">Demo e Análise de Reviews</h3>
                
                {latestDemo && (
                    <Card>
                        <CardHeader><CardTitle className="text-xl flex items-center"><Clock className="h-5 w-5 mr-2" /> Último Tracking da Demo ({formatDate(latestDemo.date)})</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KpiCard title="Downloads" value={formatNumber(latestDemo.downloads)} />
                            <KpiCard title="Tempo Médio Jogo Demo" value={latestDemo.avgPlaytime} />
                            <KpiCard title="Tempo Total Demo" value={latestDemo.totalDemoTime} />
                            <KpiCard title="Tempo Total Jogo" value={latestDemo.totalGameTime} />
                        </CardContent>
                    </Card>
                )}

                {latestReview && (
                    <Card>
                        <CardHeader><CardTitle className="text-xl flex items-center"><MessageSquare className="h-5 w-5 mr-2" /> Última Análise de Reviews ({formatDate(latestReview.date)})</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KpiCard title="Classificação" value={latestReview.rating} />
                            <KpiCard title="Total Reviews" value={formatNumber(latestReview.reviews)} />
                            <KpiCard title="Positivas" value={formatNumber(latestReview.positive)} />
                            <KpiCard title="% Positivas" value={`${(Number(latestReview.percentage) * 100).toFixed(0)}%`} />
                        </CardContent>
                    </Card>
                )}
                
                {!latestDemo && !latestReview && (
                    <p className="text-muted-foreground text-center">Nenhum dado de Demo ou Review disponível.</p>
                )}
            </div>
        );
    };

    // --- Main Render Logic ---
    
    let content;
    switch (slideId) {
        case 'intro':
            content = renderIntroSlide();
            break;
        case 'wl-sales':
            content = renderWLSalesSlide();
            break;
        case 'marketing-summary':
            content = renderMarketingSummarySlide();
            break;
        case 'influencers':
            content = renderInfluencersSlide();
            break;
        case 'paid-traffic':
            content = renderPaidTrafficSlide();
            break;
        case 'demo-reviews':
            content = renderDemoReviewsSlide();
            break;
        default:
            content = <p className="text-muted-foreground">Slide não encontrado.</p>;
    }

    return (
        <Card className="w-full h-full shadow-2xl border-4 border-gogo-cyan/50 bg-card/95 backdrop-blur-sm">
            <CardHeader className="border-b border-border">
                <CardTitle className="text-3xl font-bold text-gogo-cyan">{slideTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[calc(100%-70px)] overflow-y-auto">
                {content}
            </CardContent>
        </Card>
    );
};

export default PresentationSlide;