import { useMemo } from 'react';
import { Game as SupabaseGame } from '@/integrations/supabase/games';
import { TrackingData, ResultSummaryEntry } from '@/data/trackingData';
import { EstimatedGame } from '@/components/strategic/GameEstimator';
import { formatCurrency, formatNumber } from '@/lib/utils';

// Definindo um tipo unificado para o jogo de comparação (pode ser SupabaseGame ou EstimatedGame)
type ComparisonGame = SupabaseGame | EstimatedGame;

interface ComparisonMetrics {
    gameName: string;
    capsuleImageUrl: string | null | undefined;
    launchDate: Date | null;
    suggestedPrice: number | null;
    totalSales: number;
    totalWishlists: number;
    totalInvestment: number;
    wlToSalesConversionRate: number;
    latestReview: { rating: string, reviews: number, percentage: number, date: Date } | null;
    summaryTableData: ResultSummaryEntry[];
    isEstimated: boolean;
    isLocalTracking: boolean;
    timeframe: string | null; 
    estimatedRevenue: number;
}

// Helper function to format values based on key (copied from ResultSummaryPanel)
const formatSummaryValue = (key: string, value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '' || value === '#DIV/0!' || (typeof value === 'number' && isNaN(value))) return '-';
    
    let cleanedValue: number | string = value;
    if (typeof value === 'string') {
        const temp = value.replace(/R\$/, '').replace(/\./g, '').replace(/,/g, '.').trim();
        const num = parseFloat(temp);
        if (!isNaN(num)) {
            cleanedValue = num;
        } else {
            cleanedValue = value;
        }
    }

    const numValue = Number(cleanedValue);

    if (typeof cleanedValue === 'string' && cleanedValue.startsWith('R$')) return cleanedValue;

    if (key.includes('Real') || key.includes('Custo')) {
        return formatCurrency(numValue);
    }
    if (key.includes('Conversão') || key.includes('WL/Real')) {
        if (key === 'Conversão vendas/wl') {
             return `${(numValue * 100).toFixed(2)}%`;
        }
        return numValue.toFixed(2);
    }
    if (key.includes('Visualizações') || key.includes('Visitas')) {
        return formatNumber(numValue);
    }
    return String(cleanedValue);
};


export const useComparisonMetrics = (game: ComparisonGame | undefined, trackingData: TrackingData | undefined): ComparisonMetrics | null => {
    return useMemo(() => {
        if (!game || !trackingData) {
            return null;
        }

        const gameName = game.name.trim();
        
        // Check if it's an estimated game
        const isEstimated = 'estimatedSales' in game;

        let totalSales = 0;
        let totalWishlists = 0;
        let totalInvestment = 0;
        let wlToSalesConversionRate = 0;
        let latestReview = null;
        let summaryTableData: ResultSummaryEntry[] = [];
        let isLocalTracking = false;
        let timeframe: string | null = null; 
        let estimatedRevenue = 0;

        if (isEstimated) {
            const estimatedGame = game as EstimatedGame;
            totalSales = estimatedGame.estimatedSales;
            totalWishlists = estimatedGame.reviewCount || 0; 
            totalInvestment = 0; 
            wlToSalesConversionRate = totalWishlists > 0 ? totalSales / totalWishlists : 0;
            timeframe = estimatedGame.timeframe; 
            estimatedRevenue = estimatedGame.estimatedRevenue;
            
            if (estimatedGame.reviewCount) {
                latestReview = {
                    id: 'est-review',
                    reviews: estimatedGame.reviewCount,
                    positive: estimatedGame.reviewCount, 
                    negative: 0,
                    percentage: 1,
                    rating: estimatedGame.reviewSummary || 'Estimativa',
                    date: new Date(),
                };
            }

        } else {
            // Data from Supabase/Local Tracking
            isLocalTracking = true;
            const supabaseGame = game as SupabaseGame;
            const wlSales = trackingData.wlSales.filter(e => e.game.trim() === gameName && !e.isPlaceholder);
            totalSales = wlSales.reduce((sum, item) => sum + item.sales, 0);
            totalWishlists = wlSales.length > 0 ? wlSales[wlSales.length - 1].wishlists : 0;
            
            // Investment
            const investmentSources = {
                influencers: trackingData.influencerTracking.filter(d => d.game.trim() === gameName).reduce((sum, item) => sum + item.investment, 0),
                events: trackingData.eventTracking.filter(d => d.game.trim() === gameName).reduce((sum, item) => sum + item.cost, 0),
                paidTraffic: trackingData.paidTraffic.filter(d => d.game.trim() === gameName).reduce((sum, item) => sum + item.investedValue, 0),
            };
            totalInvestment = investmentSources.influencers + investmentSources.events + investmentSources.paidTraffic;

            // Conversion Rates (from Result Summary)
            const resultSummary = trackingData.resultSummary.filter(r => r.game.trim() === gameName);
            const wlToSalesSummary = resultSummary.find(r => r['Conversão vendas/wl']);
            wlToSalesConversionRate = Number(wlToSalesSummary?.['Conversão vendas/wl']) || 0;
            
            // Review Data (from WlDetails)
            const wlDetails = trackingData.wlDetails.find(d => d.game.trim() === gameName);
            latestReview = wlDetails?.reviews.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))[0] || null;
            
            // Result Summary Table Data
            summaryTableData = resultSummary.map(r => ({
                type: r.type,
                'WL/Real': r['WL/Real'],
                'Real/WL': r['Real/WL'],
                'Custo por venda': r['Custo por venda'],
                'Conversão vendas/wl': r['Conversão vendas/wl'],
            }));
        }

        return {
            gameName,
            capsuleImageUrl: game.capsule_image_url,
            launchDate: game.launch_date ? new Date(game.launch_date) : null,
            suggestedPrice: game.suggested_price || null,
            totalSales,
            totalWishlists,
            totalInvestment,
            wlToSalesConversionRate,
            latestReview,
            summaryTableData,
            isEstimated,
            isLocalTracking,
            timeframe, 
            estimatedRevenue,
        };
    }, [game, trackingData]);
};

// Export the helper function for use in the panel component
export { formatSummaryValue };