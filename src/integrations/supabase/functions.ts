import { supabase } from './client';

// NOTE: Replace 'ynlebwtutvyxybqgupke' with your actual Supabase Project ID in a real deployment.
const PROJECT_ID = 'ynlebwtutvyxybqgupke';
const EDGE_FUNCTION_URL_PROCESS = `https://${PROJECT_ID}.supabase.co/functions/v1/process-raw-data`;
const EDGE_FUNCTION_URL_FETCH_GAME = `https://${PROJECT_ID}.supabase.co/functions/v1/fetch-game-data`; // URL da função de busca

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