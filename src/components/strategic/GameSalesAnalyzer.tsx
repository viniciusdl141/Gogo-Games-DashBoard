import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GameMetrics, SalesAnalysis } from '@/data/trackingData';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { Clock, TrendingUp, DollarSign, Info } from 'lucide-react';
import KpiCard from '../dashboard/KpiCard';

interface GameSalesAnalyzerProps {
    game: GameMetrics;
    salesAnalysis: SalesAnalysis;
}

const GameSalesAnalyzer: React.FC<GameSalesAnalyzerProps> = ({ game, salesAnalysis }) => {
    const { totalSales, totalRevenue, temporalAnalysis } = salesAnalysis;

    const launchDate = useMemo(() => {
        if (game.launch_date) {
            try {
                return new Date(game.launch_date);
            } catch (e) {
                return null;
            }
        }
        return null;
    }, [game.launch_date]);

    const timeOnMarketText = useMemo(() => {
        if (temporalAnalysis.timeOnMarketMonths === 0) return "Menos de 1 mês";
        return `${temporalAnalysis.timeOnMarketMonths} meses`;
    }, [temporalAnalysis.timeOnMarketMonths]);

    return (
        <Card className="shadow-lg border-t-4 border-gogo-orange">
            <CardHeader>
                <CardTitle className="text-xl text-gogo-orange flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" /> Análise de Vendas Históricas
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <KpiCard
                        title="Vendas Totais"
                        value={formatNumber(totalSales)}
                        icon={<DollarSign className="h-4 w-4 text-gogo-green" />}
                        description="Total de cópias vendidas."
                    />
                    <KpiCard
                        title="Receita Total Estimada"
                        value={formatCurrency(totalRevenue)}
                        icon={<DollarSign className="h-4 w-4 text-gogo-green" />}
                        description="Receita bruta estimada (Vendas * Preço Sugerido)."
                    />
                    <KpiCard
                        title="Preço Sugerido"
                        value={formatCurrency(game.suggested_price)}
                        icon={<Info className="h-4 w-4 text-gray-500" />}
                        description="Preço sugerido do jogo (USD)."
                    />
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-semibold mb-3 text-gray-700">Análise Temporal</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard
                        title="Tempo de Mercado"
                        value={timeOnMarketText}
                        icon={<Clock className="h-4 w-4 text-gogo-cyan" />}
                        description={launchDate ? `Lançado em ${formatDate(launchDate)}` : "Data de lançamento não definida."}
                    />
                    <KpiCard
                        title="Velocidade Média de Vendas"
                        value={temporalAnalysis.averageSpeed}
                        icon={<TrendingUp className="h-4 w-4 text-gogo-orange" />}
                        description="Cópia vendidas por mês (Média Geral / Meses)"
                    />
                    <KpiCard
                        title="Veredito Temporal"
                        value={temporalAnalysis.verdict}
                        icon={<Info className="h-4 w-4 text-gray-500" />}
                        description="Avaliação da performance de vendas ao longo do tempo."
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default GameSalesAnalyzer;