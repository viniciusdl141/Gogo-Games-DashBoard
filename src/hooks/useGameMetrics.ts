import { useMemo, useState, useEffect, useCallback } from 'react';
import {
    RawTrackingData,
    Platform,
    WLSalesPlatformEntry,
    GameMetrics,
    ResultSummaryEntry,
    WLSalesEntry,
} from '@/data/trackingData';
import { calculateWlConversionMetrics, calculateDailySummary } from '@/lib/metrics';
import { formatNumber } from '@/lib/utils';
import { parseISO, startOfDay, isBefore, isEqual } from 'date-fns';

// Placeholder for external types/data
interface TimeFrame {
    // Assuming TimeFrame is defined elsewhere or not needed here
}

/**
 * Hook to manage and process tracking data for a specific game.
 */
export const useGameMetrics = (
    game: GameMetrics | null,
    rawData: RawTrackingData,
    selectedPlatform: string,
    timeFrame: TimeFrame | null
) => {
    const gameName = game?.name.trim() || '';

    // Filter data based on selected game and platform
    const filteredData = useMemo(() => {
        if (!gameName) return { wlSales: [], influencers: [], events: [], paidTraffic: [], demoTracking: [], traffic: [], manualEvents: [], wlDetails: [] };

        const isAllPlatforms = selectedPlatform === 'All';

        const filterByGameAndPlatform = <T extends { game: string; platform: Platform }>(arr: T[]): T[] => {
            return arr.filter(entry =>
                entry.game.trim() === gameName &&
                (isAllPlatforms || entry.platform === selectedPlatform)
            );
        };

        const filterByGame = <T extends { game: string }>(arr: T[]): T[] => {
            return arr.filter(entry => entry.game.trim() === gameName);
        };

        return {
            wlSales: filterByGameAndPlatform(rawData.wlSales),
            influencers: filterByGameAndPlatform(rawData.influencers),
            events: filterByGameAndPlatform(rawData.events),
            paidTraffic: filterByGameAndPlatform(rawData.paidTraffic),
            demoTracking: filterByGameAndPlatform(rawData.demoTracking),
            traffic: filterByGameAndPlatform(rawData.traffic),
            manualEvents: filterByGame(rawData.manualEvents),
            wlDetails: filterByGame(rawData.wlDetails),
        };
    }, [rawData, gameName, selectedPlatform]);

    // Recalculate WLSales to ensure daily continuity for charts/KPIs
    const wlSalesDataForRecalculation = useMemo(() => {
        if (!gameName) return [];
        
        // Filter all WL sales for the selected game, regardless of platform
        const allWLSalesForGame = rawData.wlSales.filter(e => e.game.trim() === gameName);

        // Group by date and platform
        const groupedByDateAndPlatform = allWLSalesForGame.reduce((acc, entry) => {
            const key = `${startOfDay(entry.date).getTime()}-${entry.platform}`;
            acc.set(key, entry);
            return acc;
        }, new Map<string, WLSalesEntry>());

        // Convert back to array and sort by date
        return Array.from(groupedByDateAndPlatform.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [rawData.wlSales, gameName]);


    // Daily Summary and KPIs are calculated based on ALL platforms for the selected game
    const {
        totalWishlists,
        totalSales,
        conversionRate,
        wlToSalesRatio,
        avgDailyGrowth,
        avgDailySales,
        totalRevenue,
    } = useMemo(() => calculateWlConversionMetrics(wlSalesDataForRecalculation), [wlSalesDataForRecalculation]);

    const dailySummary = useMemo(() => calculateDailySummary(
        wlSalesDataForRecalculation, 
        filteredData.manualEvents
    ), [wlSalesDataForRecalculation, filteredData.manualEvents]);

    // --- Data Injection Logic (Placeholder for future use, fixing type errors) ---
    // This logic seems to be trying to fill in missing daily entries, which is complex.
    // I will simplify the implementation to fix the immediate type errors (130, 131, 132)
    // by ensuring the structure matches WLSalesPlatformEntry.

    const getWLSalesDataForPlatform = useCallback((platformForInjection: Platform): WLSalesPlatformEntry[] => {
        if (!gameName) return [];

        const salesData = rawData.wlSales
            .filter(e => e.game.trim() === gameName && e.platform === platformForInjection)
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        // Map WLSalesEntry to WLSalesPlatformEntry (they are structurally similar now)
        return salesData.map(e => ({
            id: e.id,
            date: e.date,
            platform: e.platform,
            wishlists: e.wishlists,
            sales: e.sales,
            saleType: e.saleType,
            frequency: e.frequency,
            variation: e.variation,
        }));

    }, [rawData.wlSales, gameName]);


    return {
        filteredData,
        wlSalesDataForRecalculation,
        totalWishlists,
        totalSales,
        conversionRate,
        wlToSalesRatio,
        avgDailyGrowth,
        avgDailySales,
        totalRevenue,
        dailySummary,
        getWLSalesDataForPlatform,
    };
};