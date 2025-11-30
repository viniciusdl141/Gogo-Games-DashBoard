import { useMemo } from 'react';
import {
    WLSalesEntry,
    InfluencerTrackingEntry,
    EventTrackingEntry,
    PaidTrafficEntry,
    DemoTrackingEntry,
    GameMetrics,
    EstimatedGame,
    ComparisonGame,
    ResultSummaryEntry,
} from '@/data/trackingData';
import { formatNumber, formatCurrency } from '@/lib/utils';

// --- Helper Types ---

interface TrackingDataSubset {
    wlSales: WLSalesEntry[];
    influencers: InfluencerTrackingEntry[];
    events: EventTrackingEntry[];
    paidTraffic: PaidTrafficEntry[];
    demoTracking: DemoTrackingEntry[];
}

// Define a structure for review data if available
interface LatestReview {
    rating: number;
    reviews: number;
    percentage: number;
}

// Updated ComparisonMetrics interface
export interface ComparisonMetrics {
    gameName: string;
    capsuleImageUrl: string | null;
    launchDate: Date | null;
    suggestedPrice: number | null;
    totalSales: number;
    totalWishlists: number;
    conversionRate: number;
    wlToSalesRatio: number;
    salesToWlRatio: number;
    revenue: number;
    summaryTableData: ResultSummaryEntry[];
    
    // Metrics used for comparison logic
    totalInvestment: number; // Sum of costs from all tracking types
    wlToSalesConversionRate: number; // Same as conversionRate, but explicitly named for comparison logic
    isLocalTracking: boolean;
    isEstimated: boolean;
    timeframe: string | null;
    estimatedRevenue: number | null;
    latestReview: LatestReview | null;
}

// --- Core Logic ---

/**
 * Calculates conversion metrics for a specific tracking type (Influencers, Events, Paid Traffic).
 */
const calculateTypeMetrics = <T extends { wishlists: number; sales: number; cost?: number; game: string }>(
    data: T[],
    type: 'Influencers' | 'Eventos' | 'Trafego Pago',
    gameName: string
) => {
    const totalWL = data.reduce((sum, entry) => sum + entry.wishlists, 0);
    const totalSales = data.reduce((sum, entry) => sum + entry.sales, 0);
    const totalCost = data.reduce((sum, entry) => sum + (entry.cost || 0), 0);

    const wlToReal = totalWL > 0 ? totalSales / totalWL : 0;
    const realToWl = totalSales > 0 ? totalWL / totalSales : 0;
    const costPerSale = totalSales > 0 ? totalCost / totalSales : 0;
    const conversionSalesWl = totalWL > 0 ? totalSales / totalWL : 0;

    return {
        game: gameName,
        type,
        'WL/Real': formatNumber(realToWl),
        'Real/WL': formatNumber(wlToReal),
        'Custo por venda': formatCurrency(costPerSale),
        'Conversão vendas/wl': `${(conversionSalesWl * 100).toFixed(2)}%`,
    };
};

/**
 * Hook to calculate comparison metrics for a game (either tracked or estimated).
 */
export const useComparisonMetrics = (game: ComparisonGame, localTrackingData: TrackingDataSubset): ComparisonMetrics => {
    return useMemo(() => {
        const gameName = game.name.trim();

        // 1. Calculate Total Sales and Wishlists from WLSalesEntry
        const wlSalesForGame = localTrackingData.wlSales.filter(e => e.game.trim() === gameName);
        const totalSales = wlSalesForGame.reduce((sum, entry) => sum + entry.sales, 0);
        const totalWishlists = wlSalesForGame.reduce((sum, entry) => sum + entry.wishlists, 0);

        // 2. Calculate Conversion Metrics
        const conversionRate = totalWishlists > 0 ? totalSales / totalWishlists : 0;
        const wlToSalesRatio = totalSales > 0 ? totalWishlists / totalSales : 0;
        const salesToWlRatio = totalWishlists > 0 ? totalSales / totalWishlists : 0;

        // 3. Calculate Revenue and Investment
        const suggestedPrice = 'suggested_price' in game ? game.suggested_price : game.suggestedPrice;
        const revenue = totalSales * (suggestedPrice || 0);

        const totalInvestment = localTrackingData.influencers.filter(e => e.game.trim() === gameName).reduce((sum, e) => sum + e.cost, 0) +
                                localTrackingData.events.filter(e => e.game.trim() === gameName).reduce((sum, e) => sum + e.cost, 0) +
                                localTrackingData.paidTraffic.filter(e => e.game.trim() === gameName).reduce((sum, e) => sum + e.cost, 0);

        // 4. Calculate Tracking Type Summaries
        const influencerData = localTrackingData.influencers.filter(e => e.game.trim() === gameName);
        const eventData = localTrackingData.events.filter(e => e.game.trim() === gameName);
        const paidTrafficData = localTrackingData.paidTraffic.filter(e => e.game.trim() === gameName);

        const resultSummary = [
            calculateTypeMetrics(influencerData, 'Influencers', gameName),
            calculateTypeMetrics(eventData, 'Eventos', gameName),
            calculateTypeMetrics(paidTrafficData, 'Trafego Pago', gameName),
        ];

        // Result Summary Table Data
        const summaryTableData: ResultSummaryEntry[] = resultSummary.map(r => ({
            game: r.game,
            type: r.type,
            'WL/Real': r['WL/Real'],
            'Real/WL': r['Real/WL'],
            'Custo por venda': r['Custo por venda'],
            'Conversão vendas/wl': r['Conversão vendas/wl'],
        }));

        // Determine properties based on type (GameMetrics or EstimatedGame)
        const isEstimated = 'estimatedSales' in game;
        const isLocalTracking = 'studio_id' in game;

        const capsuleImageUrl = 'capsule_image_url' in game ? game.capsule_image_url : game.capsuleImageUrl;
        const launchDateRaw = 'launch_date' in game ? game.launch_date : game.launchDate;
        const finalLaunchDate = launchDateRaw instanceof Date ? launchDateRaw : (launchDateRaw ? new Date(launchDateRaw) : null);
        
        // Placeholder for latest review data (assuming we don't have this data readily available for external games)
        const latestReview: LatestReview | null = null;

        return {
            gameName,
            capsuleImageUrl,
            launchDate: finalLaunchDate,
            suggestedPrice: suggestedPrice,
            totalSales,
            totalWishlists,
            conversionRate,
            wlToSalesRatio,
            salesToWlRatio,
            revenue,
            summaryTableData,
            totalInvestment,
            wlToSalesConversionRate: conversionRate,
            isLocalTracking,
            isEstimated,
            timeframe: isEstimated ? (game as EstimatedGame).timeframe : null,
            estimatedRevenue: isEstimated ? (game as EstimatedGame).estimatedRevenue : null,
            latestReview,
        };
    }, [game, localTrackingData]);
};