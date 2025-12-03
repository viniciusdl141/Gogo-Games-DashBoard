// Tipos de dados estruturados esperados do processador de IA
export interface InfluencerTrackingData {
    date: string; // YYYY-MM-DD
    game: string;
    influencer: string;
    platform: string;
    action: string;
    contentType: string;
    views: number;
    investment: number;
    estimatedWL: number;
    observations?: string;
}

export interface EventTrackingData {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    event: string;
    game: string;
    action: string;
    cost: number;
    wlGenerated: number;
    views: number;
}

export interface PaidTrafficData {
    game: string;
    network: string;
    impressions: number;
    clicks: number;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    investedValue: number;
    estimatedWishlists: number;
}

export interface WLSalesData {
    date: string; // YYYY-MM-DD
    game: string;
    platform: string;
    wishlists: number;
    sales: number;
    saleType: 'Padrão' | 'Bundle' | 'DLC';
    frequency: 'Diário' | 'Semanal' | 'Mensal';
}

export interface DemoTrackingData {
    date: string; // YYYY-MM-DD
    game: string;
    downloads: number;
    avgPlaytime: string;
    totalDemoTime: string;
    totalGameTime: string;
}

export interface TrafficTrackingData {
    game: string;
    platform: string;
    startDate: string;
    endDate: string;
    visits: number;
    impressions: number;
    clicks: number;
    source: string;
}

export interface ManualEventMarkerData {
    date: string; // YYYY-MM-DD
    game: string;
    name: string;
}

export interface StructuredData {
    influencerTracking: InfluencerTrackingData[];
    eventTracking: EventTrackingData[];
    paidTraffic: PaidTrafficData[];
    wlSales: WLSalesData[];
    demoTracking: DemoTrackingData[];
    trafficTracking: TrafficTrackingData[];
    manualEventMarkers: ManualEventMarkerData[];
}

export interface AIResponse {
    structuredData: StructuredData;
}