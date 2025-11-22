import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { OpenAI } from 'https://deno.land/x/openai@v4.33.0/mod.ts'; 

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


async function processDataWithAI(rawData: string, gameName: string, aiApiKey: string): Promise<any> {
    
    if (!aiApiKey) {
        throw new Error("Chave da API da IA não fornecida.");
    }

    try {
        const openai = new OpenAI({ apiKey: aiApiKey });
        
        const prompt = `Você é um assistente de processamento de dados de jogos. Sua tarefa é analisar o texto bruto fornecido abaixo e convertê-lo em um objeto JSON estritamente seguindo o esquema JSON fornecido. O jogo em questão é ${gameName}.
        
        Instruções Críticas:
        1. Converta todas as datas (Data, Começo, Final, etc.) para o formato ISO 8601 string (YYYY-MM-DDTHH:MM:SS.sssZ).
        2. Garanta que todos os campos numéricos sejam números (não strings).
        3. O objeto JSON de saída DEVE aderir estritamente ao esquema fornecido.
        
        Esquema JSON de Saída: ${JSON.stringify(JSON_SCHEMA)}
        
        Dados Brutos para Análise:
        ---
        ${rawData}
        ---`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Modelo rápido e capaz de JSON
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });
        
        const content = response.choices[0].message.content;
        
        if (!content) {
             throw new Error("A IA não retornou conteúdo JSON.");
        }

        // Tenta parsear o JSON retornado
        const structuredData = JSON.parse(content);
        return structuredData;

    } catch (e) {
        console.error("Erro ao chamar a API de IA:", e);
        // Retorna o erro de forma clara para o frontend
        throw new Error(`Falha na comunicação com a API de IA: ${e.message}. Verifique se a chave é válida e se o modelo está acessível.`);
    }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData, gameName, aiApiKey } = await req.json();

    if (!rawData || !gameName || !aiApiKey) {
      return new Response(JSON.stringify({ error: 'Missing rawData, gameName, or aiApiKey' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Processar dados usando a função REAL
    const structuredData = await processDataWithAI(rawData, gameName, aiApiKey);

    return new Response(JSON.stringify({ structuredData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});