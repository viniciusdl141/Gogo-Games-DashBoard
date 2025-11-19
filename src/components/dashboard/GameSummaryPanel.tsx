"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, List, TrendingUp } from 'lucide-react';
import KpiCard from './KpiCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface GameSummaryPanelProps {
    gameName: string;
    totalSales: number;
    totalWishlists: number;
    // KPIs de Investimento já vêm do Dashboard
    totalInvestment: number;
}

const GameSummaryPanel: React.FC<GameSummaryPanelProps> = ({ 
    gameName, 
    totalSales, 
    totalWishlists, 
    totalInvestment 
}) => {
    const [gamePrice, setGamePrice] = React.useState(19.99); // Preço padrão em R$
    const [revenueShare, setRevenueShare] = React.useState(0.70); // 70% (Steam/Epic geralmente 70/30)

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setGamePrice(isNaN(value) ? 0 : value);
    };

    const handleShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setRevenueShare(isNaN(value) ? 0 : value / 100);
    };

    // Cálculos Financeiros
    const grossRevenue = totalSales * gamePrice;
    const netRevenue = grossRevenue * revenueShare;
    const netProfit = netRevenue - totalInvestment;
    const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Resumo Geral do Jogo: {gameName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* KPIs de Vendas e WL */}
                <div className="grid gap-4 md:grid-cols-3">
                    <KpiCard 
                        title="Vendas Totais (Est.)" 
                        value={formatNumber(totalSales)} 
                        icon={<TrendingUp className="h-4 w-4 text-green-600" />} 
                    />
                    <KpiCard 
                        title="Wishlists Totais" 
                        value={formatNumber(totalWishlists)} 
                        icon={<List className="h-4 w-4 text-blue-600" />} 
                    />
                    <KpiCard 
                        title="Investimento Total (R$)" 
                        value={formatCurrency(totalInvestment)} 
                        icon={<DollarSign className="h-4 w-4 text-red-600" />} 
                    />
                </div>

                <Separator />

                {/* Calculadora Financeira */}
                <h3 className="text-xl font-semibold mb-4">Calculadora Financeira (Estimativa)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>

                <div className="grid gap-4 md:grid-cols-4 pt-4">
                    <KpiCard 
                        title="Receita Bruta (Est.)" 
                        value={formatCurrency(grossRevenue)} 
                    />
                    <KpiCard 
                        title="Receita Líquida (Est.)" 
                        value={formatCurrency(netRevenue)} 
                    />
                    <KpiCard 
                        title="Lucro Líquido (Est.)" 
                        value={formatCurrency(netProfit)} 
                        description={netProfit >= 0 ? "Parabéns!" : "Revisar custos."}
                    />
                    <KpiCard 
                        title="ROI (%)" 
                        value={`${roiPercentage.toFixed(2)}%`} 
                        description={totalInvestment === 0 ? "Sem investimento para calcular ROI" : undefined}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default GameSummaryPanel;