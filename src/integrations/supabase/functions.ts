import { supabase } from './client';

// NOTE: Replace 'ynlebwtutvyxybqgupke' with your actual Supabase Project ID in a real deployment.
const PROJECT_ID = 'ynlebwtutvyxybqgupke';
const EDGE_FUNCTION_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/process-raw-data`;

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

export async function invokeAIDataProcessor(rawData: string, gameName: string): Promise<AIResponse> {
    // Usamos supabase.functions.invoke para lidar com autenticação e URL base automaticamente
    const { data, error } = await supabase.functions.invoke('process-raw-data', {
        body: { rawData, gameName },
    });

    if (error) {
        throw new Error(`Edge Function Error: ${error.message}`);
    }
    
    // O dado retornado é o corpo da resposta JSON
    if (data && data.structuredData) {
        return data as AIResponse;
    }

    throw new Error("Estrutura de resposta inválida do processador de IA.");
}