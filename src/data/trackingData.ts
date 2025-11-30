import { z } from 'zod';

// --- Supabase Types ---

export type Profile = {
    id: string;
    email: string;
    role: 'admin' | 'studio' | 'user';
    studio_id: string | null;
    created_at: string;
};

// --- Tracking Data Types ---

export const PlatformSchema = z.enum(['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Android', 'iOS', 'Epic Games', 'Outra']);
export type Platform = z.infer<typeof PlatformSchema>;

export const ALL_PLATFORMS_WITH_ALL = ['All', ...PlatformSchema.options] as const;
export type AllPlatforms = typeof ALL_PLATFORMS_WITH_ALL[number];

export interface WLSalesEntry {
    id: string;
    date: Date;
    platform: Platform;
    wishlists: number;
    sales: number;
    game: string;
}

export interface WLSalesPlatformEntry {
    id: string;
    date: Date;
    platform: Platform;
    wishlists: number;
    sales: number;
}

export interface InfluencerTrackingEntry {
    id: string;
    date: Date;
    influencer: string;
    platform: Platform;
    views: number;
    wishlists: number;
    sales: number;
    cost: number;
    game: string;
}

export interface EventTrackingEntry {
    id: string;
    date: Date;
    event: string;
    platform: Platform;
    wishlists: number;
    sales: number;
    cost: number;
    game: string;
}

export interface PaidTrafficEntry {
    id: string;
    date: Date;
    network: string;
    platform: Platform;
    clicks: number;
    impressions: number;
    wishlists: number;
    sales: number;
    cost: number;
    game: string;
}

export interface DemoTrackingEntry {
    id: string;
    date: Date;
    platform: Platform;
    downloads: number;
    wishlists: number;
    sales: number;
    game: string;
}

export interface TrafficEntry {
    id: string;
    date: Date;
    platform: Platform;
    source: string;
    visits: number;
    wishlists: number;
    sales: number;
    game: string;
}

export interface ManualEventMarker {
    id: string;
    date: Date;
    type: 'Launch' | 'Major Update' | 'Sale' | 'Event' | 'Other';
    description: string;
    game: string;
}

export interface ReviewEntry {
    id: string;
    date: Date;
    platform: Platform;
    score: number; // 0-100 or similar scale
    summary: string;
    game: string;
}

export interface BundleEntry {
    id: string;
    name: string;
    bundleUnits: number;
    packageUnits: number;
    sales: string; // Formatted currency string
    xsolla: string; // Xsolla specific data
}

export interface WlDetails {
    game: string;
    suggestedPrice: number | null;
    launchDate: Date | null;
    reviews: ReviewEntry[];
    bundles: BundleEntry[];
}

export interface RawTrackingData {
    wlSales: WLSalesEntry[];
    influencers: InfluencerTrackingEntry[];
    events: EventTrackingEntry[];
    paidTraffic: PaidTrafficEntry[];
    demoTracking: DemoTrackingEntry[];
    traffic: TrafficEntry[];
    manualEvents: ManualEventMarker[];
    wlDetails: WlDetails[];
}

// --- Strategic Types ---

export interface GameMetrics {
    id: string;
    name: string;
    launch_date: string | null;
    suggested_price: number | null;
    capsule_image_url: string | null;
    category: string | null;
    developer: string | null;
    publisher: string | null;
    review_summary: string | null;
    price_usd: number | null;
    studio_id: string | null;
}

export interface EstimatedGame {
    id: string;
    name: string;
    capsuleImageUrl: string | null;
    launchDate: Date | null;
    suggestedPrice: number | null;
    totalSales: number;
    totalRevenue: number;
    estimatedSales: number;
    estimatedRevenue: number;
    estimationMethod: string;
    timeframe: string;
    category: string | null;
    reviews: number | null;
    priceBRL: number | null;
}

export type ComparisonGame = GameMetrics | EstimatedGame;

export interface ResultSummaryEntry {
    game: string;
    type: 'Influencers' | 'Eventos' | 'Trafego Pago';
    'WL/Real': string | number;
    'Real/WL': string | number;
    'Custo por venda': string | number;
    'Conversão vendas/wl': string | number;
}

export interface TemporalAnalysis {
    timeOnMarketMonths: number;
    averageSpeed: string;
    verdict: string;
}

export interface SalesAnalysis {
    totalSales: number;
    totalRevenue: number;
    temporalAnalysis: TemporalAnalysis;
}

export interface GameEstimatorResult {
    method: string;
    sales: number;
    revenue: number;
    timeframe: string;
}

export interface EstimatorFormValues {
    category: string;
    reviews: number;
    priceBRL: number;
    discountFactor: number;
    ccuPeak: number;
    nbMultiplier: number;
    ccuMultiplier: number;
    methodsToCombine: string[];
}

export const initialRawData: RawTrackingData = {
    wlSales: [],
    influencers: [],
    events: [],
    paidTraffic: [],
    demoTracking: [],
    traffic: [],
    manualEvents: [],
    wlDetails: [],
};