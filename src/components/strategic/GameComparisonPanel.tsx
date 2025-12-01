"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GameOption } from '@/integrations/supabase/games';
import { ResultSummaryEntry, TrackingData } from '@/data/trackingData';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, List, TrendingUp, Clock, Gauge, Info } from 'lucide-react';
import KpiCard from '../dashboard/KpiCard'; // Importado KpiCard
import LaunchTimer from '../dashboard/LaunchTimer';

// Tipagem para jogos estimados (do GameEstimator)
export interface EstimatedGame extends GameOption {
    estimatedSales: number;
    estimatedRevenue: number;
    estimationMethod: string;
    timeframe: string;
}

// Tipagem para jogos de comparação (pode ser um jogo real ou estimado)
export type ComparisonGame = GameOption | EstimatedGame;

interface GameComparisonPanelProps {
    game1: ComparisonGame | null;
    game2: ComparisonGame | null;
    localTrackingData: TrackingData;
}

// Helper para calcular o resumo de resultados para um jogo
const calculateResultSummary = (gameName: string, localTrackingData: TrackingData): ResultSummaryEntry[] => {
    return localTrackingData.resultSummary.filter(r => r.game.trim() === gameName);
};

// Helper para calcular KPIs básicos
const calculateKpis = (game: ComparisonGame, localTrackingData: TrackingData) => {
    const gameName = game.name;
    
    // Se for um jogo estimado, usamos os dados estimados
    if ('estimatedSales' in game) {
        return {
            gameName,
            capsuleImageUrl: game.capsule_image_url,
            launchDate: game.launch_date ? new Date(game.launch_date) : null,
            suggestedPrice: game.suggested_price,
            totalSales: game.estimatedSales,
            totalRevenue: game.estimatedRevenue,
            isEstimated: true,
            estimationMethod: game.estimationMethod,
            timeframe: game.timeframe,
        };
    }

    // Se for um jogo real (GameOption), calculamos a partir dos dados de tracking
    const wlSales = localTrackingData.wlSales.filter(d => d.game.trim() === gameName);
    const totalSales = wlSales.reduce((sum, item) => sum + item.sales, 0);
    const totalRevenue = totalSales * (game.suggested_price || 19.99); // Estimativa simples de receita

    return {
        gameName,
        capsuleImageUrl: game.capsule_image_url, // Corrigido o erro 20
        launchDate: game.launch_date ? new Date(game.launch_date) : null, // Corrigido o erro 21, 22
        suggestedPrice: game.suggested_price, // Corrigido o erro 23
        totalSales,
        totalRevenue,
        isEstimated: false,
        estimationMethod: 'Dados Reais',
        timeframe: 'Total',
    };
};

const GameComparisonPanel: React.FC<GameComparisonPanelProps> = ({ game1, game2, localTrackingData }) => {
    const comparisonData = useMemo(() => {
        const data1 = game1 ? calculateKpis(game1, localTrackingData) : null;
        const data2 = game2 ? calculateKpis(game2, localTrackingData) : null;

        const summary1 = game1 ? calculateResultSummary(game1.name, localTrackingData) : [];
        const summary2 = game2 ? calculateResultSummary(game2.name, localTrackingData) : [];

        return { data1, data2, summary1, summary2 };
    }, [game1, game2, localTrackingData]);

    const { data1, data2, summary1, summary2 } = comparisonData;

    const renderGameCard = (data: ReturnType<typeof calculateKpis> | null, summary: ResultSummaryEntry[]) => {
        if (!data) {
            return (
                <Card className="p-4 h-full flex items-center justify-center bg-muted/50 border-dashed border-2">
                    <p className="text-muted-foreground">Selecione um jogo para comparação.</p>
                </Card>
            );
        }

        // Result Summary Table Data
        const summaryTableData = summary.map(r => ({ // Corrigido o erro 19: O tipo ResultSummaryEntry requer 'game'
            type: r.type,
            game: r.game, // Adicionado 'game'
            'WL/Real': r['WL/Real'] || '-',
            'Real/WL': r['Real/WL'] || '-',
            'Custo por venda': r['Custo por venda'] || '-',
            'Conversão vendas/wl': r['Conversão vendas/wl'] || '-',
        }));

        return (
            <Card className="h-full flex flex-col">
                <CardHeader className="p-4 border-b">
                    <div className="flex items-center space-x-3">
                        {data.capsuleImageUrl && (
                            <img src={data.capsuleImageUrl} alt={data.gameName} className="w-12 h-12 object-cover rounded-md" />
                        )}
                        <CardTitle className="text-xl">{data.gameName}</CardTitle>
                    </div>
                    <div className="mt-2">
                        <LaunchTimer launchDate={data.launchDate} />
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 flex-grow">
                    <div className="grid grid-cols-2 gap-4">
                        <KpiCard
                            title="Vendas Totais"
                            value={formatNumber(data.totalSales)}
                            description={data.isEstimated ? `Estimativa (${data.timeframe})` : 'Unidades vendidas'}
                            icon={<List className="h-4 w-4 text-gogo-cyan" />}
                        />
                        <KpiCard
                            title="Receita Estimada"
                            value={formatCurrency(data.totalRevenue)}
                            description={`Preço base: ${formatCurrency(data.suggestedPrice || 0)}`}
                            icon={<DollarSign className="h-4 w-4 text-gogo-orange" />}
                        />
                    </div>

                    <Separator />

                    <h4 className="text-lg font-semibold flex items-center text-muted-foreground">
                        <Gauge className="h-4 w-4 mr-2" /> Métricas de Conversão
                    </h4>
                    
                    {summaryTableData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">WL/Real</TableHead>
                                        <TableHead className="text-right">Real/WL</TableHead>
                                        <TableHead className="text-right">Custo/Venda</TableHead>
                                        <TableHead className="text-right">Conv. Vendas/WL</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summaryTableData.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{row.type}</TableCell>
                                            <TableCell className="text-right">{row['WL/Real']}</TableCell>
                                            <TableCell className="text-right">{row['Real/WL']}</TableCell>
                                            <TableCell className="text-right">{row['Custo por venda']}</TableCell>
                                            <TableCell className="text-right">{row['Conversão vendas/wl']}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">Nenhum resumo de resultados disponível.</p>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gogo-cyan">Comparação de Jogos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderGameCard(data1, summary1)}
                {renderGameCard(data2, summary2)}
            </div>
        </div>
    );
};

export default GameComparisonPanel;