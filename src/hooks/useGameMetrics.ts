import { useMemo } from 'react';
import { startOfDay, subDays, addDays, isBefore, isEqual } from 'date-fns';
import { 
    TrackingData, 
    Platform, 
    WLSalesPlatformEntry, 
    InfluencerTrackingEntry, 
    EventTrackingEntry, 
    PaidTrafficEntry, 
    ManualEventMarker, 
    TrafficEntry, 
    ResultSummaryEntry,
    recalculateWLSalesForPlatform
} from '@/data/trackingData';
import { Game as SupabaseGame } from '@/integrations/supabase/games';
import { rawData } from '@/data/rawTrackingData';
import { TimeFrame } from '@/components/dashboard/WlConversionKpisPanel';

// Helper to generate unique IDs locally (for placeholders)
let localIdCounter = 0;
const generateLocalUniqueId = (prefix: string = 'track') => `${prefix}-${localIdCounter++}`;

export interface GameMetrics {
    gameId: string;
    gameName: string;
    launchDate: Date | null;
    suggestedPrice: number;
    capsuleImageUrl: string | null;
    category: string | null;
    
    // Filtered Data
    wlSales: WLSalesPlatformEntry[];
    realWLSales: WLSalesPlatformEntry[];
    influencerTracking: InfluencerTrackingEntry[];
    eventTracking: EventTrackingEntry[];
    paidTraffic: PaidTrafficEntry[];
    demoTracking: any[];
    trafficTracking: TrafficEntry[];
    manualEventMarkers: ManualEventMarker[];
    resultSummary: ResultSummaryEntry[];
    wlDetails: any;
    influencerSummary: any[];

    // KPIs
    totalSales: number;
    totalWishlists: number;
    totalInvestment: number;
    totalInfluencerViews: number;
    totalEventViews: number;
    totalImpressions: number;
    investmentSources: { influencers: number, events: number, paidTraffic: number };
    avgDailyGrowth: number;
    totalGrowth: number;
    visitorToWlConversionRate: number;
    wlToSalesConversionRate: number;
}

interface UseGameMetricsProps {
    selectedGameName: string;
    selectedGame: SupabaseGame | undefined;
    trackingData: TrackingData;
    selectedPlatform: Platform | 'All';
    selectedTimeFrame: TimeFrame;
}

export const useGameMetrics = ({
    selectedGameName,
    selectedGame,
    trackingData,
    selectedPlatform,
    selectedTimeFrame,
}: UseGameMetricsProps): GameMetrics | null => {
    
    // Reset counter on every calculation to ensure consistent placeholder IDs
    localIdCounter = 0; 

    return useMemo(() => {
        if (!selectedGameName) return null;

        const gameName = selectedGameName.trim();
        const gameId = selectedGame?.id || '';
        const launchDate = selectedGame?.launch_date ? new Date(selectedGame.launch_date) : null;
        const suggestedPrice = selectedGame?.suggested_price || 19.99;
        const capsuleImageUrl = selectedGame?.capsule_image_url || null;
        const category = selectedGame?.category || null;

        const platformForInjection: Platform = selectedPlatform === 'All' ? 'Steam' : selectedPlatform as Platform;

        // 1. Filter and enhance data, recalculating dynamic fields
        const influencerTracking = trackingData.influencerTracking
            .filter(d => d.game.trim() === gameName)
            .map(item => ({
                ...item,
                roi: item.estimatedWL > 0 ? item.investment / item.estimatedWL : '-',
            }));
        
        const eventTracking = trackingData.eventTracking
            .filter(d => d.game.trim() === gameName)
            .map(item => ({
                ...item,
                roi: item.wlGenerated > 0 ? item.cost / item.wlGenerated : '-',
                costPerView: item.views > 0 ? item.cost / item.views : '-',
            }));

        const paidTraffic = trackingData.paidTraffic
            .filter(d => d.game.trim() === gameName)
            .map(item => ({
                ...item,
                networkConversion: item.impressions > 0 ? item.clicks / item.impressions : 0,
                estimatedCostPerWL: item.estimatedWishlists > 0 ? item.investedValue / item.estimatedWishlists : '-',
            }));
        
        // Filter real WL Sales by selected game AND platform
        const realWLSales = trackingData.wlSales
            .filter(d => d.game.trim() === gameName)
            .filter(d => selectedPlatform === 'All' || d.platform === selectedPlatform)
            .filter(d => !d.isPlaceholder)
            .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

        const manualEventMarkers = trackingData.manualEventMarkers
            .filter(m => m.game.trim() === gameName);

        const trafficTrackingFiltered = trackingData.trafficTracking
            .filter(t => t.game.trim() === gameName);

        const demoTracking = trackingData.demoTracking.filter(d => d.game.trim() === gameName);
        const resultSummary = trackingData.resultSummary.filter(d => d.game.trim() === gameName);
        const wlDetails = trackingData.wlDetails.find(d => d.game.trim() === gameName);

        // --- Inject placeholder entries for event dates without WL data ---
        
        const minRealWLDateTimestamp = realWLSales.length > 0 
            ? Math.min(...realWLSales.map(e => startOfDay(e.date!).getTime()))
            : null;

        const allDates = new Set<number>();
        realWLSales.forEach(e => e.date && allDates.add(startOfDay(e.date).getTime()));
        eventTracking.forEach(e => {
            if (e.startDate && e.endDate) {
                let currentDate = startOfDay(e.startDate);
                const endDate = startOfDay(e.endDate);
                while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
                    allDates.add(currentDate.getTime());
                    currentDate = addDays(currentDate, 1);
                }
            }
        });
        manualEventMarkers.forEach(m => allDates.add(startOfDay(m.date).getTime()));

        let sortedDates = Array.from(allDates).sort((a, b) => a - b);
        
        if (minRealWLDateTimestamp !== null) {
            sortedDates = sortedDates.filter(dateTimestamp => dateTimestamp >= minRealWLDateTimestamp);
        }
        
        const realWLSalesMap = new Map(realWLSales.map(e => [startOfDay(e.date!).getTime(), e]));

        let lastWLValue = 0; 
        const finalWLSales: WLSalesPlatformEntry[] = [];

        for (const dateTimestamp of sortedDates) {
            const date = new Date(dateTimestamp);
            const existingRealEntry = realWLSalesMap.get(dateTimestamp);

            if (existingRealEntry) {
                finalWLSales.push(existingRealEntry);
                lastWLValue = existingRealEntry.wishlists;
            } else {
                const placeholderEntry: WLSalesPlatformEntry = {
                    id: generateLocalUniqueId('wl-placeholder'),
                    date: date,
                    game: gameName,
                    platform: platformForInjection,
                    wishlists: lastWLValue,
                    sales: 0,
                    variation: 0,
                    saleType: 'Padrão',
                    frequency: 'Diário',
                    isPlaceholder: true,
                };
                finalWLSales.push(placeholderEntry);
            }
        }

        const wlSales = finalWLSales.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
        // --- End Placeholder Injection ---

        // 2. Recalculate Influencer Summary
        const influencerSummaryMap = new Map<string, { totalActions: number, totalInvestment: number, wishlistsGenerated: number }>();

        influencerTracking.forEach(item => {
            const influencer = item.influencer;
            const current = influencerSummaryMap.get(influencer) || { totalActions: 0, totalInvestment: 0, wishlistsGenerated: 0 };
            
            current.totalActions += 1;
            current.totalInvestment += item.investment;
            current.wishlistsGenerated += item.estimatedWL; 
            
            influencerSummaryMap.set(influencer, current);
        });

        const influencerSummary = Array.from(influencerSummaryMap.entries()).map(([influencer, data]) => ({
            game: gameName,
            influencer: influencer,
            totalActions: data.totalActions,
            totalInvestment: data.totalInvestment,
            wishlistsGenerated: data.wishlistsGenerated,
            avgROI: data.wishlistsGenerated > 0 ? data.totalInvestment / data.wishlistsGenerated : '-',
        }));


        // 3. KPI Calculations (based on ALL platforms for the game, except for WL/Sales which respects platform filter)
        const investmentSources = {
            influencers: trackingData.influencerTracking.filter(d => d.game.trim() === gameName).reduce((sum, item) => sum + item.investment, 0),
            events: trackingData.eventTracking.filter(d => d.game.trim() === gameName).reduce((sum, item) => sum + item.cost, 0),
            paidTraffic: trackingData.paidTraffic.filter(d => d.game.trim() === gameName).reduce((sum, item) => sum + item.investedValue, 0),
        };

        const totalInvestment = investmentSources.influencers + investmentSources.events + investmentSources.paidTraffic;

        const totalInfluencerViews = influencerTracking.reduce((sum, item) => sum + item.views, 0);
        const totalEventViews = eventTracking.reduce((sum, item) => sum + item.views, 0);
        const totalImpressions = paidTraffic.reduce((sum, item) => sum + item.impressions, 0);
        
        const totalWLIncrease = realWLSales.length > 0 
            ? realWLSales[realWLSales.length - 1].wishlists - (realWLSales[0].wishlists - realWLSales[0].variation)
            : 0;
        
        const totalSales = realWLSales.reduce((sum, item) => sum + item.sales, 0);
        const totalWishlists = realWLSales.length > 0 ? realWLSales[realWLSales.length - 1].wishlists : 0;

        // 4. Calculate WL Growth Metrics based on selectedTimeFrame
        
        let daysToSubtract = 0;
        switch (selectedTimeFrame) {
            case 'weekly': daysToSubtract = 7; break;
            case 'monthly': daysToSubtract = 30; break;
            case 'quarterly': daysToSubtract = 90; break;
            case 'semiannual': daysToSubtract = 180; break;
            case 'annual': daysToSubtract = 365; break;
            case 'total': 
            default: 
                daysToSubtract = 99999;
        }

        const today = startOfDay(new Date());
        const startDateLimit = subDays(today, daysToSubtract);

        const wlEntriesInTimeFrame = realWLSales.filter(e => 
            e.date && (selectedTimeFrame === 'total' || startOfDay(e.date).getTime() >= startDateLimit.getTime())
        );

        let totalGrowthInPeriod = 0;
        let avgDailyGrowthInPeriod = 0; 

        if (selectedTimeFrame === 'total') {
            totalGrowthInPeriod = totalWLIncrease; 
            const totalDaysTracked = realWLSales.length > 0 ? (realWLSales[realWLSales.length - 1].date!.getTime() - realWLSales[0].date!.getTime()) / (1000 * 60 * 60 * 24) + 1 : 0;
            avgDailyGrowthInPeriod = totalDaysTracked > 0 ? totalWLIncrease / totalDaysTracked : 0;
        } else {
            const firstEntryInPeriod = wlEntriesInTimeFrame[0];
            const lastEntryInPeriod = wlEntriesInTimeFrame[wlEntriesInTimeFrame.length - 1];
            
            if (firstEntryInPeriod && lastEntryInPeriod) {
                const indexBeforeStart = realWLSales.findIndex(e => e.id === firstEntryInPeriod.id) - 1;
                const wlBeforePeriod = indexBeforeStart >= 0 ? realWLSales[indexBeforeStart].wishlists : 0;
                
                totalGrowthInPeriod = lastEntryInPeriod.wishlists - wlBeforePeriod;

                const daysInPeriod = (lastEntryInPeriod.date!.getTime() - firstEntryInPeriod.date!.getTime()) / (1000 * 60 * 60 * 24) + 1;
                avgDailyGrowthInPeriod = daysInPeriod > 0 ? totalGrowthInPeriod / daysInPeriod : 0;

            } else {
                totalGrowthInPeriod = 0;
                avgDailyGrowthInPeriod = 0;
            }
        }
        
        // 5. Calculate Conversion Rates
        
        const wlToSalesSummary = trackingData.resultSummary.find(r => r.game.trim() === gameName && r['Conversão vendas/wl']);
        const wlToSalesConversionRate = Number(wlToSalesSummary?.['Conversão vendas/wl']) || 0;

        let totalVisits = 0;
        let totalWishlistsInTrafficPeriod = 0;
        let visitorToWlConversionRate = 0;

        const relevantPlatform = selectedPlatform === 'All' ? 'Steam' : selectedPlatform;
        const latestTrafficEntry = trafficTrackingFiltered
            .filter(t => t.platform === relevantPlatform)
            .sort((a, b) => (b.endDate?.getTime() || 0) - (a.endDate?.getTime() || 0))[0];

        if (latestTrafficEntry && latestTrafficEntry.startDate && latestTrafficEntry.endDate) {
            totalVisits = latestTrafficEntry.visits;
            
            const trafficStart = startOfDay(latestTrafficEntry.startDate).getTime();
            const trafficEnd = startOfDay(latestTrafficEntry.endDate).getTime();

            const wlEntriesInTrafficPeriod = realWLSales.filter(e => 
                e.date && startOfDay(e.date).getTime() >= trafficStart && startOfDay(e.date).getTime() <= trafficEnd
            );

            if (wlEntriesInTrafficPeriod.length > 1) {
                const initialWL = wlEntriesInTrafficPeriod[0].wishlists - wlEntriesInTrafficPeriod[0].variation;
                const finalWL = wlEntriesInTrafficPeriod[wlEntriesInTrafficPeriod.length - 1].wishlists;
                totalWishlistsInTrafficPeriod = finalWL - initialWL;
            } else if (wlEntriesInTrafficPeriod.length === 1) {
                 totalWishlistsInTrafficPeriod = wlEntriesInTrafficPeriod[0].variation;
            }
            
            if (totalVisits > 0) {
                visitorToWlConversionRate = totalWishlistsInTrafficPeriod / totalVisits;
            }
        } else {
            const rawTrafficData = rawData['Trafego pago'] as any[];
            const gameConversionEntry = rawTrafficData.find(item => item.Game_1?.trim() === gameName);
            visitorToWlConversionRate = Number(gameConversionEntry?.['Conversão Steam']) || 0;
        }
        
        return {
            gameId,
            gameName,
            launchDate,
            suggestedPrice,
            capsuleImageUrl,
            category,
            
            wlSales,
            realWLSales,
            influencerTracking,
            eventTracking,
            paidTraffic,
            demoTracking,
            trafficTracking: trafficTrackingFiltered,
            manualEventMarkers,
            resultSummary,
            wlDetails,
            influencerSummary,

            totalSales,
            totalWishlists,
            totalInvestment,
            totalInfluencerViews,
            totalEventViews,
            totalImpressions,
            investmentSources,
            avgDailyGrowth: avgDailyGrowthInPeriod,
            totalGrowth: totalGrowthInPeriod,
            visitorToWlConversionRate,
            wlToSalesConversionRate,
        };
    }, [selectedGameName, selectedGame, trackingData, selectedPlatform, selectedTimeFrame]);
};