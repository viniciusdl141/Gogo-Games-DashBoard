import { supabase } from './client';

// NOTE: Replace 'ynlebwtutvyxybqgupke' with your actual Supabase Project ID in a real deployment.
const PROJECT_ID = 'ynlebwtutvyxybqgupke';
const EDGE_FUNCTION_BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;

const EDGE_FUNCTION_URL_PROCESS = `${EDGE_FUNCTION_BASE_URL}/process-raw-data`;
const EDGE_FUNCTION_URL_FETCH_GAME = `${EDGE_FUNCTION_BASE_URL}/fetch-game-data`; 
const EDGE_FUNCTION_URL_ANALYZE_SALES = `${EDGE_FUNCTION_BASE_URL}/analyze-game-sales`; 
const EDGE_FUNCTION_URL_ADMIN_CREATE_USER = `${EDGE_FUNCTION_BASE_URL}/admin-create-user`; // Re-adding URL

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
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const response = await fetch(EDGE_FUNCTION_URL_PROCESS, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ rawData, gameName, aiApiKey, aiProvider }),
    });

    const responseText = await response.text();
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        // Se o status for 2xx mas o corpo não for JSON, lançamos um erro claro
        if (response.ok) {
            throw new Error(`Edge Function returned 2xx status but response body is not valid JSON. Raw response: ${responseText}`);
        }
        // Se o status não for 2xx e o corpo não for JSON, usamos o status code
        throw new Error(`Edge Function returned status ${response.status}. Raw response: ${responseText}`);
    }

    if (!response.ok) {
        // Se a resposta não for 2xx, lança um erro com a mensagem detalhada do corpo
        const errorMessage = data.error || `Edge Function retornou status ${response.status}.`;
        throw new Error(`Falha no processamento da IA: ${errorMessage}`);
    }
    
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