import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { OpenAI } from 'https://deno.land/x/openai@v4.33.0/mod.ts'; 
import { GoogleGenAI } from "https://deno.land/x/google_genai@v0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define a estrutura esperada para o retorno da IA
const JSON_SCHEMA = {
    type: "object",
    properties: {
        influencerTracking: {
            type: "array",
            description: "Lista de InfluencerTrackingEntry. Converta datas para ISO string (YYYY-MM-DDTHH:MM:SS.sssZ).",
            items: { type: "object" }
        },
        eventTracking: {
            type: "array",
            description: "Lista de EventTrackingEntry. Converta datas para ISO string.",
            items: { type: "object" }
        },
        paidTraffic: {
            type: "array",
            description: "Lista de PaidTrafficEntry. Converta datas para ISO string.",
            items: { type: "object" }
        },
        wlSales: {
            type: "array",
            description: "Lista de WLSalesPlatformEntry. Converta datas para ISO string.",
            items: { type: "object" }
        },
        demoTracking: {
            type: "array",
            description: "Lista de DemoTrackingEntry. Converta datas para ISO string.",
            items: { type: "object" }
        },
        trafficTracking: {
            type: "array",
            description: "Lista de TrafficEntry. Converta datas para ISO string.",
            items: { type: "object" }
        },
        manualEventMarkers: {
            type: "array",
            description: "Lista de ManualEventMarker. Converta datas para ISO string.",
            items: { type: "object" }
        }
    },
    required: ["influencerTracking", "eventTracking", "paidTraffic", "wlSales", "demoTracking", "trafficTracking", "manualEventMarkers"]
};

const SYSTEM_PROMPT = (gameName: string, jsonSchema: string) => `Você é um assistente de processamento de dados de jogos. Sua tarefa é analisar o texto bruto fornecido e convertê-lo em um objeto JSON estritamente seguindo o esquema JSON fornecido. O jogo em questão é ${gameName}.

Instruções Críticas:
1. Converta todas as datas (Data, Começo, Final, etc.) para o formato ISO 8601 string (YYYY-MM-DDTHH:MM:SS.sssZ).
2. Garanta que todos os campos numéricos sejam números (não strings).
3. O objeto JSON de saída DEVE aderir estritamente ao esquema fornecido.
4. Se não houver dados para uma categoria, retorne um array vazio para essa chave.

Esquema JSON de Saída: ${jsonSchema}`;

async function callOpenAICompatibleAPI(aiApiKey: string, rawData: string, gameName: string, provider: 'openai' | 'deepseek' | 'mistral'): Promise<any> {
    let baseURL = undefined;
    let model = "gpt-4o-mini";

    if (provider === 'deepseek') {
        baseURL = "https://api.deepseek.com/v1";
        model = "deepseek-coder"; // Modelo DeepSeek para JSON/codificação
    } else if (provider === 'mistral') {
        baseURL = "https://api.mistral.ai/v1";
        model = "mistral-large-latest"; // Modelo Mistral
    }

    const openai = new OpenAI({ apiKey: aiApiKey, baseURL });
    
    const prompt = SYSTEM_PROMPT(gameName, JSON.stringify(JSON_SCHEMA));

    const response = await openai.chat.completions.create({
        model: model,
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: `Dados Brutos:\n---\n${rawData}\n---` }
        ],
        response_format: { type: "json_object" },
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
         throw new Error(`A IA (${provider}) não retornou conteúdo JSON.`);
    }
    return JSON.parse(content);
}

async function callGeminiAPI(aiApiKey: string, rawData: string, gameName: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: aiApiKey });
    const model = "gemini-2.5-flash";
    
    const prompt = SYSTEM_PROMPT(gameName, JSON.stringify(JSON_SCHEMA));

    const response = await ai.models.generateContent({
        model: model,
        contents: [
            { role: "user", parts: [{ text: prompt + `\n\nDados Brutos:\n---\n${rawData}\n---` }] }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: JSON_SCHEMA,
        }
    });

    const content = response.text.trim();
    if (!content) {
        throw new Error("A IA (Gemini) não retornou conteúdo JSON.");
    }
    return JSON.parse(content);
}


async function processDataWithAI(rawData: string, gameName: string, aiApiKey: string, aiProvider: string): Promise<any> {
    
    if (!aiApiKey) {
        throw new Error("Chave da API da IA não fornecida.");
    }

    try {
        switch (aiProvider) {
            case 'openai':
                return await callOpenAICompatibleAPI(aiApiKey, rawData, gameName, 'openai');
            case 'gemini':
                return await callGeminiAPI(aiApiKey, rawData, gameName);
            case 'deepseek':
                return await callOpenAICompatibleAPI(aiApiKey, rawData, gameName, 'deepseek');
            case 'mistral':
                return await callOpenAICompatibleAPI(aiApiKey, rawData, gameName, 'mistral');
            default:
                throw new Error(`Provedor de IA desconhecido: ${aiProvider}`);
        }
    } catch (e) {
        console.error("Erro ao chamar a API de IA:", e);
        // Captura o erro específico do OpenAI/Gemini e retorna a mensagem
        const errorMessage = e.message || "Erro desconhecido ao comunicar com a API de IA.";
        throw new Error(`Falha na API de IA (${aiProvider}): ${errorMessage}`);
    }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData, gameName, aiApiKey, aiProvider } = await req.json();

    if (!rawData || !gameName || !aiApiKey || !aiProvider) {
      return new Response(JSON.stringify({ error: 'Dados de entrada incompletos (rawData, gameName, aiApiKey, ou aiProvider faltando).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const structuredData = await processDataWithAI(rawData, gameName, aiApiKey, aiProvider);

    return new Response(JSON.stringify({ structuredData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    // Retorna o erro com status 500 e Content-Type JSON
    return new Response(JSON.stringify({ error: error.message || 'Erro interno desconhecido na Edge Function.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});