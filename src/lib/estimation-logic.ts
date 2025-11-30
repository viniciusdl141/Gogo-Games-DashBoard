// src/lib/estimation-logic.ts

import { VG_INSIGHTS_MULTIPLIERS } from './constants';

export type EstimationMethod = 'boxleiter' | 'carless' | 'gamalytic' | 'vginsights' | 'ccu' | 'revenue';

export interface EstimatorFormValues {
    reviews: number;
    priceBRL: number;
    discountFactor: number;
    ccuPeak: number;
    nbMultiplier: number;
    ccuMultiplier: number;
    category: string;
    methodsToCombine: string[];
}

export interface MethodResult {
    sales: number;
    revenue: number;
    method: string;
    timeframe: string;
}

export const calculateMethod = (method: EstimationMethod, values: EstimatorFormValues): MethodResult | null => {
    const { reviews, priceBRL, discountFactor, ccuPeak, nbMultiplier, ccuMultiplier, category } = values;

    switch (method) {
        case 'boxleiter': {
            const sales = reviews * 30;
            const revenue = sales * priceBRL * discountFactor;
            return { method: 'Boxleiter Ajustado (M=30)', sales, revenue, timeframe: 'Ciclo de Vida Total (3-5 anos)' };
        }
        case 'carless': {
            const sales = reviews * nbMultiplier;
            const revenue = sales * priceBRL * discountFactor;
            return { method: `Simon Carless (NB=${nbMultiplier})`, sales, revenue, timeframe: 'Ciclo de Vida Total (3-5 anos)' };
        }
        case 'gamalytic': {
            let multiplier = 35; // Default
            if (priceBRL < 25) {
                multiplier = 20;
            } else if (priceBRL > 100) {
                multiplier = 50;
            } else {
                multiplier = 35;
            }
            const sales = reviews * multiplier;
            const revenue = sales * priceBRL * discountFactor;
            return { method: `Gamalytic (M=${multiplier})`, sales, revenue, timeframe: 'Ciclo de Vida Total (3-5 anos)' };
        }
        case 'vginsights': {
            const multiplier = VG_INSIGHTS_MULTIPLIERS[category] || 35;
            const sales = reviews * multiplier;
            const revenue = sales * priceBRL * discountFactor;
            return { method: `VG Insights (M=${multiplier})`, sales, revenue, timeframe: 'Ciclo de Vida Total (3-5 anos)' };
        }
        case 'ccu': {
            if (ccuPeak === 0) return null;
            const sales = ccuPeak * ccuMultiplier;
            const revenue = sales * priceBRL * discountFactor;
            return { method: `SteamDB CCU (M=${ccuMultiplier})`, sales, revenue, timeframe: 'Primeiro Ano (12 meses)' };
        }
        case 'revenue': {
            const sales = reviews * 30; 
            const revenue = sales * priceBRL * 0.65; 
            return { method: 'Receita Simplificada (Fator 0.65)', sales, revenue, timeframe: 'Ciclo de Vida Total (3-5 anos)' };
        }
        default:
            return null;
    }
};

export const calculateHybridAverage = (results: MethodResult[], methodsToCombine: string[]) => {
    const allMethods: { method: EstimationMethod, result: MethodResult | null }[] = [
        { method: 'boxleiter', result: results.find(r => r.method.includes('Boxleiter')) || null },
        { method: 'carless', result: results.find(r => r.method.includes('Simon Carless')) || null },
        { method: 'gamalytic', result: results.find(r => r.method.includes('Gamalytic')) || null },
        { method: 'vginsights', result: results.find(r => r.method.includes('VG Insights')) || null },
        { method: 'ccu', result: results.find(r => r.method.includes('SteamDB CCU')) || null },
        { method: 'revenue', result: results.find(r => r.method.includes('Receita Simplificada')) || null },
    ];

    const combinedResults = allMethods
        .filter(m => m.result !== null && methodsToCombine.includes(m.method))
        .map(m => m.result!);

    const totalSales = combinedResults.reduce((sum, r) => sum + r.sales, 0);
    const totalRevenue = combinedResults.reduce((sum, r) => sum + r.revenue, 0);
    const count = combinedResults.length;

    const avgSales = count > 0 ? totalSales / count : 0;
    const avgRevenue = count > 0 ? totalRevenue / count : 0;

    return {
        avgSales,
        avgRevenue,
        count,
    };
};