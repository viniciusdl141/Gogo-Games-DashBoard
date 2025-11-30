import { WLSalesEntry, GameMetrics, RawTrackingData, ManualEventMarker } from '@/data/trackingData';
import { differenceInMonths, isPast, parseISO, startOfDay } from 'date-fns';
import { formatNumber } from './utils';

/**
 * Calculates core conversion metrics from WLSales data.
 */
export function calculateWlConversionMetrics(wlSalesData: WLSalesEntry[]) {
    const totalWishlists = wlSalesData.reduce((sum, entry) => sum + entry.wishlists, 0);
    const totalSales = wlSalesData.reduce((sum, entry) => sum + entry.sales, 0);
    
    // Placeholder for revenue calculation (requires price data, which is usually stored in GameMetrics/WlDetails)
    const totalRevenue = totalSales * 10; // Mock revenue

    const conversionRate = totalWishlists > 0 ? totalSales / totalWishlists : 0;
    const wlToSalesRatio = totalSales > 0 ? totalWishlists / totalSales : 0;
    const salesToWlRatio = totalWishlists > 0 ? totalSales / totalWishlists : 0;

    // Calculate average daily growth and sales
    const uniqueDates = Array.from(new Set(wlSalesData.map(e => startOfDay(e.date).getTime())));
    const daysTracked = uniqueDates.length || 1;

    const avgDailyGrowth = totalWishlists / daysTracked;
    const avgDailySales = totalSales / daysTracked;

    return {
        totalWishlists,
        totalSales,
        conversionRate,
        wlToSalesRatio,
        salesToWlRatio,
        avgDailyGrowth,
        avgDailySales,
        totalRevenue,
    };
}

/**
 * Calculates the daily summary including cumulative metrics and events.
 */
export function calculateDailySummary(wlSalesData: WLSalesEntry[], manualEvents: ManualEventMarker[]) {
    // Group sales data by date
    const dailyDataMap = new Map<number, { date: Date, wishlists: number, sales: number }>();

    wlSalesData.forEach(entry => {
        const dayKey = startOfDay(entry.date).getTime();
        const existing = dailyDataMap.get(dayKey) || { date: startOfDay(entry.date), wishlists: 0, sales: 0 };
        
        existing.wishlists += entry.wishlists;
        existing.sales += entry.sales;
        dailyDataMap.set(dayKey, existing);
    });

    const sortedDailyData = Array.from(dailyDataMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

    let cumulativeWishlists = 0;
    let cumulativeSales = 0;

    const summary = sortedDailyData.map(day => {
        cumulativeWishlists += day.wishlists;
        cumulativeSales += day.sales;

        return {
            date: day.date,
            wishlists: day.wishlists,
            sales: day.sales,
            cumulativeWishlists,
            cumulativeSales,
            events: manualEvents.filter(e => startOfDay(e.date).getTime() === day.date.getTime()),
        };
    });

    return summary;
}

/**
 * Calculates sales analysis metrics for a game.
 */
export function calculateSalesAnalysis(game: GameMetrics, wlSalesData: WLSalesEntry[]) {
    const totalSales = wlSalesData.reduce((sum, entry) => sum + entry.sales, 0);
    const totalRevenue = totalSales * (game.suggested_price || 0);

    let timeOnMarketMonths = 0;
    let averageSpeed = 'N/A';
    let verdict = 'Aguardando dados de lançamento.';

    if (game.launch_date) {
        const launchDate = parseISO(game.launch_date);
        const now = new Date();

        if (isPast(launchDate, now)) {
            timeOnMarketMonths = differenceInMonths(now, launchDate) || 1;
            
            if (timeOnMarketMonths > 0) {
                const speed = totalSales / timeOnMarketMonths;
                averageSpeed = formatNumber(speed.toFixed(0));

                // Simple verdict logic
                if (speed > 1000) {
                    verdict = 'Excelente Velocidade';
                } else if (speed > 100) {
                    verdict = 'Boa Velocidade';
                } else {
                    verdict = 'Velocidade Moderada';
                }
            } else {
                averageSpeed = formatNumber(totalSales);
                verdict = 'Lançamento Recente';
            }
        }
    }

    return {
        totalSales,
        totalRevenue,
        temporalAnalysis: {
            timeOnMarketMonths,
            averageSpeed,
            verdict,
        },
    };
}