import { rawData } from './rawTrackingData';
import { excelSerialDateToJSDate } from '@/lib/utils';

// --- Interfaces for Normalized Data ---

export interface InfluencerTrackingEntry {
    date: Date | null;
    game: string;
    influencer: string;
    platform: string;
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
    game: string;
    date: Date | null;
    downloads: number;
    avgPlaytime: string;
    totalDemoTime: string;
    totalGameTime: string;
}

export interface WLSalesEntry {
    date: Date | null;
    game: string;
    wishlists: number;
    sales: number;
    variation: number;
    conversionRate: number | string;
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

export interface TrackingData {
    games: string[];
    influencerTracking: InfluencerTrackingEntry[];
    influencerSummary: InfluencerSummaryEntry[];
    eventTracking: EventTrackingEntry[];
    paidTraffic: PaidTrafficEntry[];
    demoTracking: DemoTrackingEntry[];
    wlSales: WLSalesEntry[];
    resultSummary: ResultSummaryEntry[];
}

// --- Data Processing Functions ---

const cleanValue = (value: any): number | string => {
    if (value === undefined || value === null || value === '-' || value === '#DIV/0!') {
        return '-';
    }
    if (typeof value === 'string') {
        // Remove R$ and commas for currency parsing
        const cleaned = value.replace(/R\$/, '').replace(/,/g, '.').trim();
        const num = parseFloat(cleaned);
        if (!isNaN(num)) return num;
        return value;
    }
    return value;
};

const processInfluencerTracking = (data: any[]): InfluencerTrackingEntry[] => {
    return data
        .filter(item => item.Game && item.Influencer)
        .map(item => ({
            date: excelSerialDateToJSDate(item.Data as number),
            game: item.Game.replace('Legavy of Evil', 'Legacy of Evil').replace('HellBrella', 'Hellbrella'),
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
            game: item.Game.replace('Legacy of Evil', 'Legacy of Evil').replace('Hellbrella', 'Hellbrella'),
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
            startDate: excelSerialDateToJSDate(item.Começo as number),
            endDate: excelSerialDateToJSDate(item.Final as number),
            event: item.Evento,
            game: item.Jogo,
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
            game: item.Game,
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
            game: item.Game,
            date: excelSerialDateToJSDate(item.Data as number),
            downloads: Number(item['Numero de downloads da demo']) || 0,
            avgPlaytime: item['Tempo medio de jogo demo'] || '-',
            totalDemoTime: item['Tempo total de demo'] || '-',
            totalGameTime: item['Tempo total do jogo'] || '-',
        }));
};

const processWLSalesSheet = (sheetData: any[], gameName: string): WLSalesEntry[] => {
    const wlSales: WLSalesEntry[] = [];
    
    // The WL data is in the first columns (Data, WL, Variação)
    // The Sales data is in later columns (Data_2, Vendas)
    
    const salesMap = new Map<number, number>();
    
    // 1. Extract Sales Data (Data_2 and Vendas)
    sheetData.forEach(item => {
        const dateKey = item.Data_2;
        const salesValue = item.Vendas;
        if (typeof dateKey === 'number' && typeof salesValue === 'number' && salesValue > 0) {
            salesMap.set(dateKey, salesValue);
        }
    });

    // 2. Extract WL Data and combine with Sales
    sheetData.forEach(item => {
        const dateKey = item.Data;
        const wlValue = item.WL;
        const variation = item.Variação;

        if (typeof dateKey === 'number' && typeof wlValue === 'number') {
            const sales = salesMap.get(dateKey) || 0;
            
            // Attempt to find conversion rate if available (complex structure, usually in the last rows)
            let conversionRate: number | string = '-';
            const conversionRow = sheetData.find(row => 
                (row.Data === 'Legacy of evil' || row.__EMPTY === gameName) && 
                typeof row['VARIAÇÃO DIARIA'] === 'number' && 
                row.Variação === dateKey
            );

            if (conversionRow) {
                conversionRate = conversionRow['VARIAÇÃO DIARIA'];
            }

            wlSales.push({
                date: excelSerialDateToJSDate(dateKey),
                game: gameName,
                wishlists: wlValue,
                sales: sales,
                variation: Number(variation) || 0,
                conversionRate: cleanValue(conversionRate),
            });
        }
    });

    return wlSales.filter(entry => entry.wishlists > 0).sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
};

const processResultSummary = (data: any[]): ResultSummaryEntry[] => {
    return data
        .filter(item => item.Jogo && item.Tipo)
        .map(item => ({
            type: item.Tipo,
            game: item.Jogo,
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
    const influencerTracking = processInfluencerTracking(rawData['Tracking Semanal Influencers']);
    const influencerSummary = processInfluencerSummary(rawData['Resumo por Influencer']);
    const eventTracking = processEventTracking(rawData['Tracking Eventos']);
    const paidTraffic = processPaidTraffic(rawData['Trafego pago']);
    const demoTracking = processDemoTracking(rawData['Tracking da demo']);
    const resultSummary = processResultSummary(rawData['RESUMO DE RESULTADOS']);

    // Aggregate WL/Sales data from multiple sheets
    const wlSales: WLSalesEntry[] = [
        ...processWLSalesSheet(rawData['Total WL - Legacy of Evil'], 'Legacy of Evil'),
        ...processWLSalesSheet(rawData['Total WL - Hellbrella'], 'Hellbrella'),
        ...processWLSalesSheet(rawData['Total WL - The Mare Show'], 'The Mare Show'),
        // Note: The other WL sheets (Dreadstone Keep, LIA Hacking Destiny variants) seem to contain mostly zero WL/Sales data or are incomplete in the provided JSON structure for daily tracking, so we rely on the main three for charting.
    ];

    // Identify all unique game names
    const allGames = new Set<string>();
    [...influencerTracking, ...eventTracking, ...paidTraffic, ...demoTracking, ...wlSales, ...resultSummary].forEach(item => {
        if (item.game) {
            allGames.add(item.game.trim());
        }
    });
    
    const games = Array.from(allGames).sort();

    return {
        games,
        influencerTracking,
        influencerSummary,
        eventTracking,
        paidTraffic,
        demoTracking,
        wlSales,
        resultSummary,
    };
};