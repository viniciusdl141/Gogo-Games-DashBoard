"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Game as SupabaseGame } from '@/integrations/supabase/games';
import { TrackingData, ResultSummaryEntry } from '@/data/trackingData';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { DollarSign, List, TrendingUp, Calendar, MessageSquare, BarChart2, ArrowRightLeft, Minus, Calculator, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import GameCapsule from '@/components/dashboard/GameCapsule';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EstimatedGame } from './GameEstimator'; 
import { useComparisonMetrics, formatSummaryValue } from '@/hooks/useComparisonMetrics'; // Importando o novo hook e helper

// Definindo um tipo unificado para o jogo de comparação (pode ser SupabaseGame ou EstimatedGame)
type ComparisonGame = SupabaseGame | EstimatedGame;

interface GameComparisonPanelProps {
    game1: ComparisonGame | undefined;
    game2: ComparisonGame | undefined;
    localTrackingData: TrackingData | undefined;
}

const GameComparisonPanel: React.FC<GameComparisonPanelProps> = ({ game1, game2, localTrackingData }) => {
    // Use o novo hook para extrair as métricas
    const metrics1 = useComparisonMetrics(game1, localTrackingData);
    const metrics2 = useComparisonMetrics(game2, localTrackingData);

    const isComparing = metrics1 || metrics2;

    if (!isComparing) {
        return (
            <Card className="min-h-[300px] flex items-center justify-center border-dashed border-2 border-border">
                <CardContent className="text-center p-6">
                    <ArrowRightLeft className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">Selecione dois jogos acima para iniciar a comparação estratégica.</p>
                </CardContent>
            </Card>
        );
    }

    const renderMetricRow = (title: string, key: keyof typeof metrics1, icon: React.ReactNode, formatFn: (value: any) => string) => {
        const val1 = metrics1 ? formatFn(metrics1[key]) : '-';
        const val2 = metrics2 ? formatFn(metrics2[key]) : '-';
        
        // Simple comparison logic for visual feedback
        let color1 = '';
        let color2 = '';
        
        // Note: We must ensure the values are numbers for comparison
        const num1 = Number(metrics1?.[key]) || 0;
        const num2 = Number(metrics2?.[key]) || 0;

        if (key === 'totalInvestment') {
            // Lower investment is generally better
            if (num1 > 0 && num2 > 0) {
                if (num1 < num2) color1 = 'text-green-500 font-bold';
                if (num2 < num1) color2 = 'text-green-500 font-bold';
            }
        } else if (key === 'wlToSalesConversionRate' || key === 'totalWishlists' || key === 'totalSales') {
            // Higher numbers are better
            if (num1 > num2) color1 = 'text-green-500 font-bold';
            if (num2 > num1) color2 = 'text-green-500 font-bold';
        }

        return (
            <TableRow>
                <TableCell className="font-medium flex items-center space-x-2 text-sm">
                    {icon} <span>{title}</span>
                </TableCell>
                <TableCell className={`text-center ${color1}`}>{val1}</TableCell>
                <TableCell className={`text-center ${color2}`}>{val2}</TableCell>
            </TableRow>
        );
    };

    const renderReviewRow = (title: string, key: 'rating' | 'reviews' | 'percentage') => {
        const val1 = metrics1?.latestReview ? (key === 'percentage' ? `${(Number(metrics1.latestReview.percentage) * 100).toFixed(0)}%` : metrics1.latestReview[key]) : '-';
        const val2 = metrics2?.latestReview ? (key === 'percentage' ? `${(Number(metrics2.latestReview.percentage) * 100).toFixed(0)}%` : metrics2.latestReview[key]) : '-';
        
        let color1 = '';
        let color2 = '';

        if (key === 'percentage') {
            const p1 = Number(metrics1?.latestReview?.percentage) || 0;
            const p2 = Number(metrics2?.latestReview?.percentage) || 0;
            if (p1 > p2) color1 = 'text-green-500 font-bold';
            if (p2 > p1) color2 = 'text-green-500 font-bold';
        }

        return (
            <TableRow>
                <TableCell className="font-medium flex items-center space-x-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" /> <span>{title}</span>
                </TableCell>
                <TableCell className={`text-center ${color1}`}>{val1}</TableCell>
                <TableCell className={`text-center ${color2}`}>{val2}</TableCell>
            </TableRow>
        );
    };

    const renderSummaryComparison = (key: keyof ResultSummaryEntry, title: string) => {
        // Only show summary comparison if both games are based on local tracking data
        if (!metrics1?.isLocalTracking || !metrics2?.isLocalTracking) return null;

        const val1 = metrics1?.summaryTableData.find(r => r.type === 'Trafego Pago')?.[key];
        const val2 = metrics2?.summaryTableData.find(r => r.type === 'Trafego Pago')?.[key];
        
        const str1 = formatSummaryValue(key, val1);
        const str2 = formatSummaryValue(key, val2);

        let color1 = '';
        let color2 = '';
        
        // Higher is better for WL/Real, lower is better for Real/WL and Custo por venda
        const isHigherBetter = key.includes('WL/Real') || key.includes('Conversão');
        
        // Clean and parse numbers for comparison
        const cleanAndParse = (str: string) => {
            const cleaned = str.replace(/[^0-9.,]/g, '').replace(',', '.');
            return parseFloat(cleaned) || 0;
        };

        const num1 = cleanAndParse(str1);
        const num2 = cleanAndParse(str2);

        if (num1 !== 0 && num2 !== 0) {
            if (isHigherBetter) {
                if (num1 > num2) color1 = 'text-green-500 font-bold';
                if (num2 > num1) color2 = 'text-green-500 font-bold';
            } else {
                if (num1 < num2) color1 = 'text-green-500 font-bold';
                if (num2 < num1) color2 = 'text-green-500 font-bold';
            }
        }

        return (
            <TableRow>
                <TableCell className="font-medium text-sm">{title}</TableCell>
                <TableCell className={`text-center ${color1}`}>{str1}</TableCell>
                <TableCell className={`text-center ${color2}`}>{str2}</TableCell>
            </TableRow>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                    <BarChart2 className="h-6 w-6 mr-2 text-gogo-orange" /> Comparação de Jogos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[30%]">Métrica</TableHead>
                                <TableHead className="text-center w-[35%]">
                                    {metrics1 ? (
                                        <div className="flex flex-col items-center">
                                            <GameCapsule imageUrl={metrics1.capsuleImageUrl} gameName={metrics1.gameName} className="w-20 h-8 mb-1" />
                                            <span className="font-bold text-gogo-cyan">{metrics1.gameName}</span>
                                        </div>
                                    ) : <span className="text-muted-foreground">Jogo 1</span>}
                                </TableHead>
                                <TableHead className="text-center w-[35%]">
                                    {metrics2 ? (
                                        <div className="flex flex-col items-center">
                                            <GameCapsule imageUrl={metrics2.capsuleImageUrl} gameName={metrics2.gameName} className="w-20 h-8 mb-1" />
                                            <span className={`font-bold ${metrics2.isEstimated ? 'text-gogo-orange' : 'text-gogo-orange'}`}>
                                                {metrics2.gameName}
                                                {metrics2.isEstimated && <Calculator className="h-3 w-3 ml-1 inline" />}
                                            </span>
                                        </div>
                                    ) : <span className="text-muted-foreground">Jogo 2</span>}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* --- Métricas Gerais --- */}
                            <TableRow className="bg-accent/50">
                                <TableCell colSpan={3} className="font-bold text-md text-gogo-cyan">Informações Básicas</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium flex items-center space-x-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" /> <span>Data de Lançamento</span>
                                </TableCell>
                                <TableCell className="text-center">{metrics1?.launchDate ? metrics1.launchDate.toLocaleDateString('pt-BR') : '-'}</TableCell>
                                <TableCell className="text-center">{metrics2?.launchDate ? metrics2.launchDate.toLocaleDateString('pt-BR') : '-'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium flex items-center space-x-2 text-sm">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" /> <span>Preço Sugerido (R$)</span>
                                </TableCell>
                                <TableCell className="text-center">{metrics1?.suggestedPrice ? formatCurrency(metrics1.suggestedPrice) : '-'}</TableCell>
                                <TableCell className="text-center">{metrics2?.suggestedPrice ? formatCurrency(metrics2.suggestedPrice) : '-'}</TableCell>
                            </TableRow>
                            
                            {/* NEW: Timeframe for Estimated Game */}
                            {metrics2?.isEstimated && (
                                <TableRow>
                                    <TableCell className="font-medium flex items-center space-x-2 text-sm text-gogo-orange">
                                        <Clock className="h-4 w-4" /> <span>Período Estimado</span>
                                    </TableCell>
                                    <TableCell className="text-center">-</TableCell>
                                    <TableCell className="text-center font-bold text-gogo-orange">{metrics2.timeframe}</TableCell>
                                </TableRow>
                            )}

                            {/* --- Métricas de Performance --- */}
                            <TableRow className="bg-accent/50">
                                <TableCell colSpan={3} className="font-bold text-md text-gogo-cyan">Performance Geral</TableCell>
                            </TableRow>
                            {renderMetricRow('Vendas Totais (Unidades)', 'totalSales', <TrendingUp className="h-4 w-4 text-muted-foreground" />, formatNumber)}
                            {renderMetricRow('Wishlists Totais', 'totalWishlists', <List className="h-4 w-4 text-muted-foreground" />, formatNumber)}
                            
                            {/* Receita Líquida Estimada (Apenas para Estimativas) */}
                            {metrics2?.isEstimated && (
                                <TableRow>
                                    <TableCell className="font-medium flex items-center space-x-2 text-sm text-gogo-orange">
                                        <DollarSign className="h-4 w-4" /> <span>Receita Líquida Estimada (R$)</span>
                                    </TableCell>
                                    <TableCell className="text-center">-</TableCell>
                                    <TableCell className="text-center font-bold text-gogo-orange">{formatCurrency(metrics2.estimatedRevenue)}</TableCell>
                                </TableRow>
                            )}

                            {/* Investimento Total (Apenas para Tracking Local) */}
                            {(!metrics2?.isEstimated || metrics1?.isLocalTracking) && (
                                renderMetricRow('Investimento Total (R$)', 'totalInvestment', <DollarSign className="h-4 w-4 text-muted-foreground" />, formatCurrency)
                            )}
                            
                            {renderMetricRow('Conversão WL -> Vendas', 'wlToSalesConversionRate', <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />, (val) => `${(Number(val) * 100).toFixed(2)}%`)}
                            
                            {/* --- Reviews --- */}
                            <TableRow className="bg-accent/50">
                                <TableCell colSpan={3} className="font-bold text-md text-gogo-cyan">Reviews (Último Registro)</TableCell>
                            </TableRow>
                            {renderReviewRow('Classificação Steam', 'rating')}
                            {renderReviewRow('Total de Reviews', 'reviews')}
                            {renderReviewRow('% Positivas', 'percentage')}

                            {/* --- Resumo de Resultados (Tráfego Pago) --- */}
                            {metrics1?.isLocalTracking && metrics2?.isLocalTracking && (
                                <>
                                    <TableRow className="bg-accent/50">
                                        <TableCell colSpan={3} className="font-bold text-md text-gogo-cyan">Métricas de Tráfego Pago (Apenas Tracking Local)</TableCell>
                                    </TableRow>
                                    {renderSummaryComparison('WL/Real', 'WL / R$')}
                                    {renderSummaryComparison('Real/WL', 'R$ / WL')}
                                    {renderSummaryComparison('Custo por venda', 'Custo / Venda')}
                                    {renderSummaryComparison('Conversão vendas/wl', 'Conversão Vendas/WL')}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default GameComparisonPanel;