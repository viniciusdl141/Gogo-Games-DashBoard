import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JSON_SCHEMA = {
    type: "object",
    properties: {
        launchDate: {
            type: "string",
            description: "Data de lançamento do jogo no formato YYYY-MM-DD. Se não for encontrada, use null."
        },
        suggestedPrice: {
            type: "number",
            description: "Preço sugerido do jogo em BRL (Reais). Se não for encontrado, use null."
        }
    },
    required: ["launchDate", "suggestedPrice"]
};

const SYSTEM_PROMPT = (gameName: string) => `Você é um assistente de busca de dados de jogos. Sua tarefa é buscar na web (usando a ferramenta Google Search) a data de lançamento e o preço sugerido na Steam para o jogo "${gameName}".

Instruções Críticas:
1. Use a ferramenta Google Search para encontrar informações públicas sobre o jogo na Steam.
2. Converta a data de lançamento para o formato ISO 8601 string (YYYY-MM-DD).
3. Converta o preço sugerido para um número (BRL). Se o preço for listado em USD, tente converter para BRL se possível, ou use o valor numérico mais provável. Se não for encontrado, use 0.
4. O objeto JSON de saída DEVE aderir estritamente ao esquema fornecido.

Esquema JSON de Saída: ${JSON.stringify(JSON_SCHEMA)}`;

async function callGeminiWebSearch(aiApiKey: string, gameName: string): Promise<any> {
    const prompt = SYSTEM_PROMPT(gameName);

    const body = {
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }],
        config: {
            responseMimeType: "application/json",
            responseSchema: JSON_SCHEMA,
            // Habilitar a ferramenta de busca na web (Google Search)
            tools: [{ googleSearch: {} }],
        }
    };

    const url = `${GEMINI_API_URL}?key=${aiApiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    if (!response.ok) {
        const errorDetail = responseJson.error?.message || responseJson.error || 'Erro desconhecido na API do Gemini.';
        throw new Error(`Falha na API Gemini (Status ${response.status}): ${errorDetail}`);
    }

    const content = responseJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!content) {
        throw new Error("A IA (Gemini) não retornou conteúdo JSON válido.");
    }
    
    return JSON.parse(content);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { gameName, aiApiKey } = await req.json();

    if (!gameName || !aiApiKey) {
      return new Response(JSON.stringify({ error: 'Dados de entrada incompletos (gameName ou aiApiKey faltando).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const structuredData = await callGeminiWebSearch(aiApiKey, gameName);

    // Ensure the returned data adheres to the expected structure
    const launchDate = structuredData.launchDate || null;
    const suggestedPrice = structuredData.suggestedPrice || null;

    return new Response(JSON.stringify({ launchDate, suggestedPrice }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno desconhecido na Edge Function.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});