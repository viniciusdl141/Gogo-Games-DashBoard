"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Game as SupabaseGame } from '@/integrations/supabase/schema'; 
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { DollarSign, List, TrendingUp, Clock, Eye, Megaphone, Download, Star, Package, Gauge } from 'lucide-react'; 
import KpiCard from '../dashboard/KpiCard';
import WLSalesChartPanel from '../dashboard/WLSalesChartPanel';
import SalesByTypeChart from '../dashboard/SalesByTypeChart';
import InfluencerPanel from '../dashboard/InfluencerPanel';
import EventPanel from '../dashboard/EventPanel';
import PaidTrafficPanel from '../dashboard/PaidTrafficPanel';
import GameSalesAnalyzer from '../strategic/GameSalesAnalyzer'; 
import { WLSalesPlatformEntry, InfluencerTrackingEntry, EventTrackingEntry, PaidTrafficEntry, DemoTrackingEntry, ResultSummaryEntry, WlDetails, ManualEventMarker } from '@/data/trackingData'; // Importando apenas as interfaces necessárias

// Interface para os dados filtrados (o que é retornado por calculateFilteredData)
interface FilteredData {
    wlSales: WLSalesPlatformEntry[];
    influencerTracking: InfluencerTrackingEntry[];
    eventTracking: EventTrackingEntry[];
    paidTraffic: PaidTrafficEntry[];
    demoTracking: DemoTrackingEntry[];
    resultSummary: ResultSummaryEntry[];
    wlDetails: WlDetails | undefined;
    manualEventMarkers: ManualEventMarker[];
    kpis: {
        totalSales: number;
        totalWishlists: number;
        totalInvestment: number;
        totalImpressions: number;
        avgCtr: number;
        grossRevenue: number;
        netRevenue: number;
        netProfit: number;
        roiPercentage: number;
        suggestedPrice: number | null;
        launchDate: Date | null;
    };
}

// Cores do gráfico ajustadas para o tema PlayStation (usadas aqui como fallback)
const DEFAULT_CHART_COLORS = {
    daily: '#00BFFF', 
    weekly: '#10B981', 
    monthly: '#8B5CF6', 
    event: '#FF6600', 
    sales: '#EF4444', 
};

interface PresentationSlideProps {
    game: SupabaseGame;
    trackingData: FilteredData; // Usando a interface FilteredData
    slideType: 'summary' | 'wl-sales' | 'marketing' | 'demo-reviews';
}

const PresentationSlide: React.FC<PresentationSlideProps> = ({ game, trackingData, slideType }) => {
    const gameName = game.name;
    const { kpis, wlSales, influencerTracking, eventTracking, paidTraffic, demoTracking, wlDetails, manualEventMarkers } = trackingData;

    // Helper para formatar ROI
    const formatRoi = (roi: number) => {
        const formatted = roi.toFixed(1);
        return `${formatted}%`;
    };

    const renderSummary = () => (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gogo-cyan mb-4">Resumo Geral</h2>
            
            <div className="grid gap-6 md:grid-cols-3">
                <KpiCard 
                    title="Vendas Totais (Unidades)"
                    value={formatNumber(kpis.totalSales)}
                    description="Unidades vendidas em todas as plataformas"
                    icon={<List className="h-5 w-5 text-gogo-cyan" />}
                />
                <KpiCard 
                    title="Wishlists Totais"
                    value={formatNumber(kpis.totalWishlists)}
                    description="Último registro de WL total"
                    icon={<TrendingUp className="h-5 w-5 text-gogo-orange" />}
                />
                <KpiCard
                    title="Receita Líquida Estimada"
                    value={formatCurrency(kpis.netRevenue)}
                    description={`Baseado em ${formatCurrency(kpis.suggestedPrice || 19.99)}`}
                    icon={<DollarSign className="h-5 w-5 text-green-600" />}
                />
            </div>

            <Card className="mt-6">
                <CardHeader><CardTitle>Análise Temporal</CardTitle></CardHeader>
                <CardContent>
                    <GameSalesAnalyzer 
                        game={game}
                        wlSalesData={wlSales} // Passando apenas os dados de WL/Sales
                    />
                </CardContent>
            </Card>
        </div>
    );

    const renderWLSales = () => (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gogo-cyan mb-4">Evolução Wishlist & Vendas</h2>
            <Card>
                <CardContent className="p-4 h-[400px]">
                    <WLSalesChartPanel 
                        data={wlSales} 
                        onPointClick={() => {}} 
                        eventTracking={eventTracking}
                        manualEventMarkers={manualEventMarkers}
                        chartColors={DEFAULT_CHART_COLORS}
                        selectedPlatform={'All'}
                    />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Vendas por Tipo (Steam)</CardTitle></CardHeader>
                <CardContent>
                    <SalesByTypeChart data={wlSales.filter(e => e.platform === 'Steam')} />
                </CardContent>
            </Card>
        </div>
    );

    const renderMarketing = () => (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gogo-cyan mb-4">Performance de Marketing</h2>
            
            <div className="grid gap-6 md:grid-cols-3">
                <KpiCard 
                    title="Investimento Total (R$)"
                    value={formatCurrency(kpis.totalInvestment)}
                    description="Soma de Influencers, Eventos e Tráfego Pago"
                    icon={<DollarSign className="h-5 w-5 text-red-500" />}
                />
                <KpiCard 
                    title="Impressões Totais"
                    value={formatNumber(kpis.totalImpressions)}
                    description="Impressões de Tráfego Pago"
                    icon={<Eye className="h-5 w-5 text-gogo-cyan" />}
                />
                <KpiCard 
                    title="ROI (%)"
                    value={formatRoi(kpis.roiPercentage)}
                    description="Lucro Líquido / Investimento Total"
                    icon={<Megaphone className="h-5 w-5 text-gogo-orange" />}
                />
            </div>

            <Card>
                <CardHeader><CardTitle>Tracking de Influencers</CardTitle></CardHeader>
                <CardContent>
                    <InfluencerPanel 
                        summary={[]} 
                        tracking={influencerTracking} 
                        onDeleteTracking={() => {}}
                        onEditTracking={() => {}}
                        games={[gameName]}
                        isPresentationMode={true} 
                    />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Tracking de Eventos</CardTitle></CardHeader>
                <CardContent>
                    <EventPanel 
                        data={eventTracking} 
                        onDeleteTracking={() => {}}
                        onEditTracking={() => {}}
                        games={[gameName]}
                        isPresentationMode={true} 
                    />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Tracking de Tráfego Pago</CardTitle></CardHeader>
                <CardContent>
                    <PaidTrafficPanel 
                        data={paidTraffic} 
                        onDeleteTracking={() => {}}
                        onEditTracking={() => {}}
                        games={[gameName]}
                        isPresentationMode={true} 
                    />
                </CardContent>
            </Card>
        </div>
    );

    const renderDemoReviews = () => {
        const latestDemo = demoTracking.length > 0 ? demoTracking[demoTracking.length - 1] : null;
        const latestReview = wlDetails?.reviews.length ? wlDetails.reviews.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0] : null;
        
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gogo-cyan mb-4">Demo, Reviews e Conversão</h2>

                {/* Demo Tracking */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center"><Download className="h-5 w-5 mr-2" /> Performance da Demo</CardTitle></CardHeader>
                    {latestDemo ? (
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KpiCard title="Downloads" value={formatNumber(latestDemo.downloads)} description="Total de downloads" icon={<Download className="h-4 w-4 text-gogo-cyan" />} /> 
                            <KpiCard title="Tempo Médio Jogo Demo" value={latestDemo.avgPlaytime} description="Média de tempo jogado" icon={<Clock className="h-4 w-4 text-gogo-orange" />} /> 
                            <KpiCard title="Tempo Total Demo" value={latestDemo.totalDemoTime} description="Tempo total acumulado na demo" icon={<Clock className="h-4 w-4 text-gogo-cyan" />} /> 
                            <KpiCard title="Tempo Total Jogo" value={latestDemo.totalGameTime} description="Tempo total acumulado no jogo completo" icon={<Clock className="h-4 w-4 text-gogo-orange" />} /> 
                        </CardContent>
                    ) : (
                        <CardContent><p className="text-muted-foreground">Nenhum dado de demo tracking disponível.</p></CardContent>
                    )}
                </Card>

                {/* Reviews */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center"><Star className="h-5 w-5 mr-2" /> Status de Reviews (Steam)</CardTitle></CardHeader>
                    {latestReview ? (
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KpiCard title="Classificação" value={latestReview.rating} description="Classificação geral" icon={<Star className="h-4 w-4 text-yellow-500" />} /> 
                            <KpiCard title="Total Reviews" value={formatNumber(latestReview.reviews)} description="Total de reviews registrados" icon={<List className="h-4 w-4 text-gogo-cyan" />} /> 
                            <KpiCard title="Positivas" value={formatNumber(latestReview.positive)} description="Contagem de reviews positivos" icon={<TrendingUp className="h-4 w-4 text-green-500" />} /> 
                            <KpiCard 
                                title="% Positivas" 
                                value={`${(Number(latestReview.percentage) * 100).toFixed(0)}%`} 
                                description="Percentual de reviews positivos" 
                                icon={<Gauge className="h-4 w-4 text-gogo-orange" />} 
                            />
                        </CardContent>
                    ) : (
                        <CardContent><p className="text-muted-foreground">Nenhum dado de reviews disponível.</p></CardContent>
                    )}
                </Card>
                
                {/* Bundles */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center"><Package className="h-5 w-5 mr-2" /> Vendas de Bundles</CardTitle></CardHeader>
                    {wlDetails?.bundles && wlDetails.bundles.length > 0 ? (
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-2 text-left">Nome</th>
                                            <th className="py-2 text-right">Unidades Bundle</th>
                                            <th className="py-2 text-right">Vendas (USD)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wlDetails.bundles.map((bundle, index) => (
                                            <tr key={index} className="border-b last:border-b-0">
                                                <td className="py-2 font-medium">{bundle.name}</td>
                                                <td className="py-2 text-right">{formatNumber(bundle.bundleUnits)}</td>
                                                <td className="py-2 text-right text-green-500">{bundle.sales}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    ) : (
                        <CardContent><p className="text-muted-foreground">Nenhum dado de bundles disponível.</p></CardContent>
                    )}
                </Card>
            </div>
        );
    };

    switch (slideType) {
        case 'summary':
            return renderSummary();
        case 'wl-sales':
            return renderWLSales();
        case 'marketing':
            return renderMarketing();
        case 'demo-reviews':
            return renderDemoReviews();
        default:
            return renderSummary();
    }
};

export default PresentationSlide;