import { supabase } from './client';

// NOTE: Replace 'ynlebwtutvyxybqgupke' with your actual Supabase Project ID in a real deployment.
const PROJECT_ID = 'ynlebwtutvyxybqgupke';
const EDGE_FUNCTION_URL_FETCH_GAME = `https://${PROJECT_ID}.supabase.co/functions/v1/fetch-game-data`; 
const EDGE_FUNCTION_URL_ANALYZE_SALES = `https://${PROJECT_ID}.supabase.co/functions/v1/analyze-game-sales`; 
const EDGE_FUNCTION_URL_ADMIN_CREATE_USER = `https://${PROJECT_ID}.supabase.co/functions/v1/admin-create-user`; // Re-adding URL

interface AIResponse {
    structuredData: {
        influencerTracking: any[];
        eventTracking: any[];
        paidTraffic: any[];
        wlSales: any[];
        demoTracking: any[];
        trafficTracking: any[];
        manualEventMarkers: any[];
    };
}

export interface GameOption {
    name: string;
    launchDate: string | null;
    suggestedPrice: number | null; // Price in BRL
    priceUSD: number | null; // New: Price in USD
    reviewCount: number | null; // New: Total reviews
    reviewSummary: string | null; // New: Review classification
    developer: string | null; // New: Developer name
    publisher: string | null; // New: Publisher name
    capsuleImageUrl: string | null; // New: Image URL
    source: string;
}

interface GameDataResponse {
    results: GameOption[];
}

// NEW: Interface for the structured analysis report
export interface SalesAnalysisReport {
    gameName: string;
    launchDate: string;
    timeSinceLaunch: string;
    totalMonths: number;
    reviews: number;
    priceBRL: number;
    priceUSD: number;
    tags: string[];
    ccuPeak: number;
    ccuPeakDate: string;
    ccuCurrent: number;
    estimationResults: Array<{
        method: string;
        logic: string;
        multiplier: number;
        estimatedSales: number;
    }>;
    averageSales: number;
    temporalAnalysis: {
        averageSpeed: string;
        peakMomentInterpretation: string;
        verdict: string;
    };
    analystNotes: {
        conflictExplanation: string;
        conclusion: string;
    };
}

export async function invokeAIDataProcessor(rawData: string, gameName: string, aiApiKey: string, aiProvider: string): Promise<AIResponse> {
    // Usamos supabase.functions.invoke para lidar com autenticação e URL base automaticamente
    const { data, error } = await supabase.functions.invoke('process-raw-data', {
        body: { rawData, gameName, aiApiKey, aiProvider }, // Passa aiApiKey e aiProvider no corpo
    });

    if (error) {
        // O SDK do Supabase lança um erro que contém a mensagem de erro do corpo da resposta 500/400
        throw new Error(`Edge Function Error: ${error.message}`);
    }
    
    // O dado retornado é o corpo da resposta JSON
    if (data && data.structuredData) {
        return data as AIResponse;
    }

    throw new Error("Estrutura de resposta inválida do processador de IA.");
}

export async function invokeGameDataFetcher(gameName: string, aiApiKey: string): Promise<GameDataResponse> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const response = await fetch(EDGE_FUNCTION_URL_FETCH_GAME, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ gameName, aiApiKey }),
    });

    const data = await response.json();

    if (!response.ok) {
        // Se a resposta não for 2xx, lança um erro com a mensagem detalhada do corpo
        const errorMessage = data.error || `Edge Function retornou status ${response.status}.`;
        throw new Error(`Falha na busca: ${errorMessage}`);
    }

    if (data && Array.isArray(data.results)) {
        return data as GameDataResponse;
    }

    throw new Error("Estrutura de resposta inválida do buscador de dados de jogos.");
}

// Function to invoke the sales analysis
export async function invokeSalesAnalyzer(gameName: string, aiApiKey: string): Promise<SalesAnalysisReport> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const response = await fetch(EDGE_FUNCTION_URL_ANALYZE_SALES, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ gameName, aiApiKey }),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data.error || `Edge Function retornou status ${response.status}.`;
        throw new Error(`Falha na análise de vendas: ${errorMessage}`);
    }

    // Validate the structure against the expected report interface
    if (data && data.gameName && data.estimationResults) {
        return data as SalesAnalysisReport;
    }

    throw new Error("Estrutura de relatório de análise de vendas inválida.");
}

// RE-ADDED: Function to invoke admin user creation
export async function invokeAdminCreateUser(email: string, password: string, studioId: string): Promise<{ success: boolean, userId: string }> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const response = await fetch(EDGE_FUNCTION_URL_ADMIN_CREATE_USER, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ email, password, studioId }),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data.error || `Edge Function retornou status ${response.status}.`;
        throw new Error(`Falha ao criar usuário: ${errorMessage}`);
    }

    if (data && data.success) {
        return data;
    }

    throw new Error("Resposta inválida da função de criação de usuário.");
}