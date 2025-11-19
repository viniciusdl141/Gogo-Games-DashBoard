"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, List, TrendingUp, Info, Eye } from 'lucide-react';
import KpiCard from './KpiCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GameSummaryPanelProps {
    gameName: string;
    totalSales: number;
    totalWishlists: number;
    totalInvestment: number;
    investmentSources: { influencers: number, events: number, paidTraffic: number };
    totalMarketingViews: number;
    totalPaidImpressions: number;
}

const GameSummaryPanel: React.FC<GameSummaryPanelProps> = ({ 
    gameName, 
    totalSales, 
    totalWishlists, 
    totalInvestment,
    investmentSources,
    totalMarketingViews,
    totalPaidImpressions
}) => {
    const [gamePrice, setGamePrice] = React.useState(19.99); // Preço padrão em R$
    const [revenueShare, setRevenueShare] = React.useState(0.70); // 70% (Steam/Epic geralmente 70/30)
    const [salesBRL, setSalesBRL] = React.useState(0);
    const [salesUSD, setSalesUSD] = React.useState(0);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setGamePrice(isNaN(value) ? 0 : value);
    };

    const handleShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setRevenueShare(isNaN(value) ? 0 : value / 100);
    };

    // Cálculos Financeiros (usando totalSales do tracking como base para a estimativa principal)
    const grossRevenue = totalSales * gamePrice;
    const netRevenue = grossRevenue * revenueShare;
    const netProfit = netRevenue - totalInvestment;
    const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    // Cálculos da Calculadora (usando inputs manuais)
    const totalManualSales = salesBRL + salesUSD;
    const grossManualRevenue = totalManualSales * gamePrice;
    const netManualRevenue = grossManualRevenue * revenueShare;
    const netManualProfit = netManualRevenue - totalInvestment;
    const roiManualPercentage = totalInvestment > 0 ? (netManualProfit / totalInvestment) * 100 : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Resumo Geral do Jogo: {gameName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* KPIs de Vendas e WL */}
                <div className="grid gap-4 md:grid-cols-4">
                    <KpiCard 
                        title="Vendas Totais (Registradas)" 
                        value={formatNumber(totalSales)} 
                        icon={<TrendingUp className="h-4 w-4 text-gogo-orange" />} 
                    />
                    <KpiCard 
                        title="Wishlists Totais (Último Reg.)" 
                        value={formatNumber(totalWishlists)} 
                        icon={<List className="h-4 w-4 text-gogo-cyan" />} 
                    />
                    <KpiCard 
                        title="Investimento Total (R$)" 
                        value={formatCurrency(totalInvestment)} 
                        icon={
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Influencers: {formatCurrency(investmentSources.influencers)}</p>
                                    <p>Eventos: {formatCurrency(investmentSources.events)}</p>
                                    <p>Tráfego Pago: {formatCurrency(investmentSources.paidTraffic)}</p>
                                </TooltipContent>
                            </Tooltip>
                        } 
                    />
                    <KpiCard title="Visualizações Marketing" value={formatNumber(totalMarketingViews)} icon={<Eye className="h-4 w-4 text-gogo-cyan" />} />
                    <KpiCard title="Impressões Tráfego Pago" value={formatNumber(totalPaidImpressions)} icon={<Eye className="h-4 w-4 text-gogo-orange" />} />
                </div>

                <Separator />

                {/* Calculadora Financeira (Oculta por padrão) */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="calculator" className="border-b">
                        <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                            Calculadora de Receita (Ferramenta Auxiliar)
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="game-price">Preço do Jogo (R$)</Label>
                                    <Input 
                                        id="game-price"
                                        type="number" 
                                        step="0.01" 
                                        value={gamePrice} 
                                        onChange={handlePriceChange} 
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="revenue-share">Repasse de Receita (%)</Label>
                                    <Input 
                                        id="revenue-share"
                                        type="number" 
                                        step="1" 
                                        value={Math.round(revenueShare * 100)} 
                                        onChange={handleShareChange} 
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sales-brl">Unidades Vendidas (R$)</Label>
                                    <Input 
                                        id="sales-brl"
                                        type="number" 
                                        step="1" 
                                        value={salesBRL} 
                                        onChange={e => setSalesBRL(parseFloat(e.target.value) || 0)} 
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sales-usd">Unidades Vendidas (USD)</Label>
                                    <Input 
                                        id="sales-usd"
                                        type="number" 
                                        step="1" 
                                        value={salesUSD} 
                                        onChange={e => setSalesUSD(parseFloat(e.target.value) || 0)} 
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4 pt-4">
                                <KpiCard 
                                    title="Receita Bruta (Calc.)" 
                                    value={formatCurrency(grossManualRevenue)} 
                                />
                                <KpiCard 
                                    title="Receita Líquida (Calc.)" 
                                    value={formatCurrency(netManualRevenue)} 
                                />
                                <KpiCard 
                                    title="Lucro Líquido (Calc.)" 
                                    value={formatCurrency(netManualProfit)} 
                                    description={netManualProfit >= 0 ? "Parabéns!" : "Revisar custos."}
                                />
                                <KpiCard 
                                    title="ROI (%) (Calc.)" 
                                    value={`${roiManualPercentage.toFixed(2)}%`} 
                                    description={totalInvestment === 0 ? "Sem investimento para calcular ROI" : undefined}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
};

export default GameSummaryPanel;