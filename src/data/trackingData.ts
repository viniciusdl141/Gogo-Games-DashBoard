import { rawData } from './rawTrackingData';
import { excelSerialDateToJSDate } from '@/lib/utils';

// --- Interfaces for Normalized Data ---

export interface InfluencerTrackingEntry {
    id: string; // Added unique ID for manipulation
    date: Date | null;
    game: string;
    influencer: string;
    platform: string; // Influencer platform (Youtube, Tiktok, etc.)
    action: string;
    contentType: string;
    views: number;
    investment: number;
    estimatedWL: number;
    roi: number | string; // Can be number or '-'
    observations?: string;
}

export interface InfluencerSummaryEntry {
    game: string;
    influencer: string;
    totalActions: number;
    totalInvestment: number;
    wishlistsGenerated: number;
    avgROI: number | string;
}

export interface EventTrackingEntry {
    id: string; // Added unique ID for manipulation
    startDate: Date | null;
    endDate: Date | null;
    event: string;
    game: string;
    action: string;
    cost: number;
    wlGenerated: number;
    roi: number | string;
    costPerView: number | string;
    views: number;
}

export interface PaidTrafficEntry {
    id: string; // Added unique ID for manipulation
    game: string;
    network: string;
    impressions: number;
    clicks: number;
    startDate: Date | null;
    endDate: Date | null;
    networkConversion: number;
    estimatedWishlists: number;
    investedValue: number;
    estimatedCostPerWL: number | string;
    validatedCostPerWL: number | string;
}

export interface DemoTrackingEntry {
    id: string; // Added unique ID for manipulation
    game: string;
    date: Date | null;
    downloads: number;
    avgPlaytime: string;
    totalDemoTime: string;
    totalGameTime: string;
}

export type SaleType = 'Padrão' | 'Bundle' | 'DLC';
export type EntryFrequency = 'Diário' | 'Semanal' | 'Mensal';
export type Platform = 'Steam' | 'Xbox' | 'Playstation' | 'Nintendo' | 'Android' | 'iOS' | 'Epic Games' | 'Outra';

export interface WLSalesPlatformEntry {
    id: string; // Unique ID for this entry
    date: Date | null;
    game: string;
    platform: Platform; // New: Platform identifier
    wishlists: number;
    sales: number; // Total sales units for this date/platform
    variation: number; // WL variation from previous entry
    saleType: SaleType; 
    frequency: EntryFrequency;
    isPlaceholder?: boolean; // New: Indicates if this entry was generated to fill a gap
}

// NEW: Manual Traffic/Visit Entry
export interface TrafficEntry {
    id: string;
    game: string;
    platform: Platform;
    startDate: Date | null;
    endDate: Date | null;
    visits: number; // Total visits/page views
    impressions: number; // Total impressions (if applicable)
    clicks: number; // Total clicks (if applicable)
    source: string; // e.g., 'Steam Analytics', 'Epic Store'
}

// NEW: Manual Event Marker Interface
export interface ManualEventMarker {
    id: string;
    game: string;
    date: Date;
    name: string;
}

export interface ReviewEntry {
    id: string;
    reviews: number;
    positive: number;
    negative: number;
    percentage: number | string;
    rating: string;
    date: Date | null;
}

export interface BundleEntry {
    id: string;
    name: string;
    bundleUnits: number;
    packageUnits: number;
    sales: string | number; // Sales in USD
    xsolla: string | number;
}

export interface ResultSummaryEntry {
    type: 'Influencers' | 'Eventos' | 'Trafego Pago';
    game: string;
    'Visualizações/Real'?: number | string;
    'Visitas/Real'?: number | string;
    'WL/Real'?: number | string;
    'Real/Visualizações'?: number | string;
    'Real/Visitas'?: number | string;
    'Real/WL'?: number | string;
    'Custo por venda'?: number | string;
    'Conversão vendas/wl'?: number | string;
}

export interface WlDetails {
    game: string;
    reviews: ReviewEntry[];
    bundles: BundleEntry[];
    traffic: any[];
}

export interface TrackingData {
    games: string[];
    influencerTracking: InfluencerTrackingEntry[];
    influencerSummary: InfluencerSummaryEntry[];
    eventTracking: EventTrackingEntry[];
    paidTraffic: PaidTrafficEntry[];
    demoTracking: DemoTrackingEntry[];
    wlSales: WLSalesPlatformEntry[]; // Updated type
    trafficTracking: TrafficEntry[]; // NEW: Manual traffic tracking
    resultSummary: ResultSummaryEntry[];
    wlDetails: WlDetails[];
    manualEventMarkers: ManualEventMarker[]; // NEW: Manual markers
}

let uniqueIdCounter = 0;
const generateUniqueId = (prefix: string = 'track') => `${prefix}-${uniqueIdCounter++}`;

const cleanValue = (value: any): number | string => {
    if (value === undefined || value === null || value === '-' || value === '#DIV/0!') {
        return '-';
    }
    if (typeof value === 'string') {
        const cleaned = value.replace(/R\$/, '').replace(/\./g, '').replace(/,/g, '.').trim();
        const num = parseFloat(cleaned);
        if (!isNaN(num)) return num;
        return value;
    }
    return value;
};

// Helper para normalizar nomes de jogos
const normalizeGameName = (name: string): string => {
    if (!name) return '';
    // Padroniza nomes comuns com inconsistências de capitalização
    const normalized = name.trim()
        .replace('Legavy of Evil', 'Legacy of Evil')
        .replace('HellBrella', 'Hellbrella')
        .replace('THE MARE SHOW', 'The Mare Show')
        .replace('DREADSTONE KEEP', 'Dreadstone Keep')
        .replace('LIA HACKING DESTINY', 'Lia Hacking Destiny');
    return normalized;
};

// EXPORTED HELPER: Recalculates variations based on total WL values
export const recalculateWLSalesForPlatform = (wlSales: WLSalesPlatformEntry[], game: string, platform: Platform): WLSalesPlatformEntry[] => {
    // Filter only real entries for calculation
    const gamePlatformEntries = wlSales
        .filter(e => e.game === game && e.platform === platform && !e.isPlaceholder)
        .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
        
    const otherEntries = wlSales.filter(e => e.game !== game || e.platform !== platform || e.isPlaceholder);

    let lastWL = 0;
    const recalculatedGamePlatformEntries = gamePlatformEntries.map(entry => {
        const currentWL = entry.wishlists;
        const currentVariation = currentWL - lastWL;
        lastWL = currentWL;
        return { ...entry, variation: currentVariation };
    });

    // Recombine real entries with placeholders (placeholders should not have their variation recalculated here)
    return [...otherEntries, ...recalculatedGamePlatformEntries].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
};


const processWLSalesSheet = (sheetData: any[], rawGameName: string, platform: Platform): WLSalesPlatformEntry[] => {
    const gameName = normalizeGameName(rawGameName);
    const wlSales: WLSalesPlatformEntry[] = [];
    const salesMap = new Map<number, number>();
    
    // Map sales data (Vendas) to dates
    sheetData.forEach(item => {
        const dateKey = item.Data_2 ?? item.__EMPTY_17;
        const salesValue = item.Vendas ?? item.__EMPTY_18;
        if (typeof dateKey === 'number' && typeof salesValue === 'number' && salesValue > 0) {
            salesMap.set(dateKey, (salesMap.get(dateKey) || 0) + salesValue);
        }
    });

    // Process WL data
    sheetData.forEach(item => {
        const dateKey = item.Data ?? item.__EMPTY;
        const wlValue = item.WL ?? item.__EMPTY_1;
        // We ignore raw variation here, it will be recalculated later
        // const variation = item.Variação ?? item.__EMPTY_9; 

        if (typeof dateKey === 'number' && typeof wlValue === 'number' && dateKey > 10000) {
            const sales = salesMap.get(dateKey) || 0;
            
            let frequency: EntryFrequency = 'Diário';
            // FIX: Ensure marker is converted to string before calling includes
            const marker = String(item.__EMPTY_1 || item.__EMPTY_10 || '');
            
            if (marker.includes('MENSAL')) {
                 frequency = 'Mensal';
            } else if (marker.includes('Semanal')) {
                 frequency = 'Semanal';
            }

            wlSales.push({
                id: generateUniqueId('wl'),
                date: excelSerialDateToJSDate(dateKey),
                game: gameName,
                platform: platform, // Set platform
                wishlists: wlValue,
                sales: sales,
                variation: 0, // Initialize variation to 0, it will be recalculated
                saleType: 'Padrão', 
                frequency: frequency, 
            });
        }
    });

    return wlSales.filter(entry => entry.wishlists > 0 || entry.sales > 0).sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
};

const processInfluencerTracking = (data: any[]): InfluencerTrackingEntry[] => {
    return data
        .filter(item => item.Game && item.Influencer)
        .map(item => ({
            id: generateUniqueId('influencer'), 
            date: excelSerialDateToJSDate(item.Data as number),
            game: normalizeGameName(item.Game),
            influencer: item.Influencer,
            platform: item['Plataforma(s)'] || '-',
            action: item['Ação Realizada'] || '-',
            contentType: item['Tipo de Conteúdo'] || '-',
            views: Number(item['Visualizações Alcançadas']) || 0,
            investment: Number(item['Investimento (R$)']) || 0,
            estimatedWL: Number(item['WL Estimadas']) || 0,
            roi: cleanValue(item['ROI (R$/WL)']),
            observations: item.Observações,
        }));
};

const processInfluencerSummary = (data: any[]): InfluencerSummaryEntry[] => {
    return data
        .filter(item => item.Game && item.Influencer !== '-')
        .map(item => ({
            game: normalizeGameName(item.Game),
            influencer: item.Influencer,
            totalActions: Number(item['Total Ações']) || 0,
            totalInvestment: Number(item['Total Investido (R$)']) || 0,
            wishlistsGenerated: Number(item['Wishlists Geradas']) || 0,
            avgROI: cleanValue(item['ROI Médio (R$/WL)']),
        }));
};

const processEventTracking = (data: any[]): EventTrackingEntry[] => {
    return data
        .filter(item => item.Jogo && item.Evento && item.Começo && item.Final)
        .map(item => ({
            id: generateUniqueId('event'), 
            startDate: excelSerialDateToJSDate(item.Começo as number),
            endDate: excelSerialDateToJSDate(item.Final as number),
            event: item.Evento,
            game: normalizeGameName(item.Jogo),
            action: item['Ação Realizada'] || '-',
            cost: Number(item['Custo Participação(R$)']) || 0,
            wlGenerated: Number(item['WL Geradas']) || 0,
            roi: cleanValue(item['ROI (R$/WL)']),
            costPerView: cleanValue(item['Custo View (R$/View)']),
            views: Number(item['Visualizações Alcançadas']) || 0,
        }));
};

const processPaidTraffic = (data: any[]): PaidTrafficEntry[] => {
    return data
        .filter(item => item.Game && item.Rede)
        .map(item => ({
            id: generateUniqueId('paid'), 
            game: normalizeGameName(item.Game),
            network: item.Rede,
            impressions: Number(item['Impressões']) || 0,
            clicks: Number(item['Cliques']) || 0,
            startDate: excelSerialDateToJSDate(item['Data inicio'] as number),
            endDate: excelSerialDateToJSDate(item['Data Final'] as number),
            networkConversion: Number(item['Conversão rede']) || 0,
            estimatedWishlists: Number(item['Wishlists (estimadas)']) || 0,
            investedValue: Number(item['Valor investido']) || 0,
            estimatedCostPerWL: cleanValue(item['Custo por wl (estimado)']),
            validatedCostPerWL: cleanValue(item['Custo por wl (validado)']),
        }));
};

const processDemoTracking = (data: any[]): DemoTrackingEntry[] => {
    return data
        .filter(item => item.Game && item.Data)
        .map(item => ({
            id: generateUniqueId('demo'), // Added ID here
            game: normalizeGameName(item.Game),
            date: excelSerialDateToJSDate(item.Data as number),
            downloads: Number(String(item['Numero de downloads da demo']).replace(/,/g, '')) || 0,
            avgPlaytime: item['Tempo medio de jogo demo'] || '-',
            totalDemoTime: item['Tempo total de demo'] || '-',
            totalGameTime: item['Tempo total do jogo'] || '-',
        }));
};

const processWlDetails = (sheetData: any[], rawGameName: string): WlDetails => {
    const gameName = normalizeGameName(rawGameName);
    const details: WlDetails = { game: gameName, reviews: [], bundles: [], traffic: [] };
    
    let reviewHeaderIndex = sheetData.findIndex(r => r.__EMPTY_19 === 'Quantidade de Reviews');
    if (reviewHeaderIndex !== -1) {
        details.reviews = sheetData.slice(reviewHeaderIndex + 1)
            .filter(r => r.__EMPTY_19 && !isNaN(Number(r.__EMPTY_19)))
            .map(r => ({
                id: generateUniqueId('review'), 
                reviews: r.__EMPTY_19,
                positive: r.__EMPTY_20,
                negative: r.__EMPTY_21,
                percentage: r.__EMPTY_22,
                rating: r.__EMPTY_23,
                date: excelSerialDateToJSDate(r.__EMPTY_24)
            }));
    }

    let bundleHeaderIndex = sheetData.findIndex(r => r.__EMPTY_19 === 'Bundle Name');
     if (bundleHeaderIndex !== -1) {
        details.bundles = sheetData.slice(bundleHeaderIndex + 1)
            .filter(r => r.__EMPTY_19)
            .map(r => ({
                id: generateUniqueId('bundle'), 
                name: r.__EMPTY_19,
                bundleUnits: r.__EMPTY_20,
                packageUnits: r.__EMPTY_21,
                sales: r.__EMPTY_22,
                xsolla: r.__EMPTY_23
            }));
    }

    let trafficHeaderIndex = sheetData.findIndex(r => r.Data === 'Trafego na pagina' || r.__EMPTY === 'Trafego na pagina');
    if (trafficHeaderIndex !== -1) {
        details.traffic = sheetData.slice(trafficHeaderIndex + 1)
            .filter(r => normalizeGameName(r.Data ?? r.__EMPTY) === gameName)
            .map(r => ({
                impressions: cleanValue(r.WL ?? r.__EMPTY_1),
                ctr: cleanValue(r.Jogo ?? r.__EMPTY_2),
                visits: cleanValue(r['WL TOTAIS'] ?? r.__EMPTY_3),
                totalVisits: cleanValue(r.__EMPTY ?? r.__EMPTY_4),
                date: excelSerialDateToJSDate(r.__EMPTY_1 ?? r.__EMPTY_5)
            }));
    }

    return details;
}

const processResultSummary = (data: any[]): ResultSummaryEntry[] => {
    return data
        .filter(item => item.Jogo)
        .map(item => ({
            type: item.Tipo,
            game: normalizeGameName(item.Jogo),
            'Visualizações/Real': cleanValue(item['Visualizações/Real']),
            'Visitas/Real': cleanValue(item['Visitas/Real']),
            'WL/Real': cleanValue(item['WL/Real']),
            'Real/Visualizações': cleanValue(item['Real/Visualizações']),
            'Real/Visitas': cleanValue(item['Real/Visitas']),
            'Real/WL': cleanValue(item['Real/WL']),
            'Custo por venda': cleanValue(item['Custo por venda']),
            'Conversão vendas/wl': cleanValue(item['Conversão vendas/wl']),
        }));
};

// --- Main Data Aggregation ---

export const getTrackingData = (): TrackingData => {
    // Reset counter for consistent IDs if data is reloaded
    uniqueIdCounter = 0; 
    
    const influencerTracking = processInfluencerTracking(rawData['Tracking Semanal Influencers']);
    const influencerSummary = processInfluencerSummary(rawData['Resumo por Influencer']);
    const eventTracking = processEventTracking(rawData['Tracking Eventos']);
    const paidTraffic = processPaidTraffic(rawData['Trafego pago']);
    const demoTracking = processDemoTracking(rawData['Tracking da demo']);
    const resultSummary = processResultSummary(rawData['RESUMO DE RESULTADOS']);

    // Process WL Sales by Platform (initial raw load)
    let wlSales: WLSalesPlatformEntry[] = [
        ...processWLSalesSheet(rawData['Total WL - Legacy of Evil'], 'Legacy of Evil', 'Steam'),
        ...processWLSalesSheet(rawData['Total WL - Hellbrella'], 'Hellbrella', 'Steam'),
        ...processWLSalesSheet(rawData['Total WL - The Mare Show'], 'The Mare Show', 'Steam'),
        ...processWLSalesSheet(rawData['Total WL - Dreadstone Keep'], 'Dreadstone Keep', 'Steam'),
        // Add other platforms from rawData, assuming 0 sales/WL for now if data is sparse
        ...processWLSalesSheet(rawData['TOTAL WL NINTENDO - LIA HACKING'], 'Lia Hacking Destiny', 'Nintendo'),
        ...processWLSalesSheet(rawData['TOTAL WL ANDROID - LIA HACKING '], 'Lia Hacking Destiny', 'Android'),
        ...processWLSalesSheet(rawData['TOTAL WL IOS - LIA HACKING DEST'], 'Lia Hacking Destiny', 'iOS'),
        ...processWLSalesSheet(rawData['TOTAL WL XBOX- LIA HACKING DEST'], 'Lia Hacking Destiny', 'Xbox'),
    ];

    // --- NEW: Recalculate variations globally after initial load ---
    const gamesInWLSales = Array.from(new Set(wlSales.map(e => e.game)));
    const platformsInWLSales = Array.from(new Set(wlSales.map(e => e.platform)));
    
    let finalWLSales: WLSalesPlatformEntry[] = [];
    
    gamesInWLSales.forEach(game => {
        platformsInWLSales.forEach(platform => {
            // Filter entries relevant to this game/platform combination
            const entriesForGamePlatform = wlSales.filter(e => e.game === game && e.platform === platform);
            if (entriesForGamePlatform.length > 0) {
                // Recalculate variations for this specific platform/game timeline
                const recalculated = recalculateWLSalesForPlatform(entriesForGamePlatform, game, platform);
                finalWLSales.push(...recalculated);
            }
        });
    });
    wlSales = finalWLSales;
    // --- End Recalculation ---

    const wlDetails: WlDetails[] = [
        processWlDetails(rawData['Total WL - Legacy of Evil'], 'Legacy of Evil'),
        processWlDetails(rawData['Total WL - Hellbrella'], 'Hellbrella'),
        processWlDetails(rawData['Total WL - The Mare Show'], 'The Mare Show'),
        processWlDetails(rawData['Total WL - Dreadstone Keep'], 'Dreadstone Keep'),
    ];

    const allGames = new Set<string>();
    [...influencerTracking, ...eventTracking, ...paidTraffic, ...demoTracking, ...wlSales, ...resultSummary].forEach(item => {
        if (item.game) {
            allGames.add(item.game.trim());
        }
    });
    
    const games = Array.from(allGames).filter(g => g).sort();

    return {
        games,
        influencerTracking,
        influencerSummary,
        eventTracking,
        paidTraffic,
        demoTracking,
        wlSales,
        trafficTracking: [], // Initialize empty array for manual traffic tracking
        resultSummary,
        wlDetails,
        manualEventMarkers: [], // Initialize empty array for manual markers
    };
};