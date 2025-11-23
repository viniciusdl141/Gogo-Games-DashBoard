import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JSON_SCHEMA = {
    type: "object",
    properties: {
        results: {
            type: "array",
            description: "Lista de 3 a 5 resultados de jogos relevantes encontrados na Steam ou em lojas de console.",
            items: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Nome completo do jogo."
                    },
                    launchDate: {
                        type: "string",
                        description: "Data de lançamento do jogo no formato YYYY-MM-DD. Se não for encontrada, use null."
                    },
                    suggestedPrice: {
                        type: "number",
                        description: "Preço sugerido do jogo em BRL (Reais). Se não for encontrado, use 0."
                    },
                    priceUSD: {
                        type: "number",
                        description: "Preço sugerido do jogo em USD (Dólares). Se não for encontrado, use 0."
                    },
                    reviewCount: {
                        type: "number",
                        description: "Número total de avaliações (reviews) na Steam. Se não for encontrado, use 0."
                    },
                    reviewSummary: {
                        type: "string",
                        description: "Resumo da classificação das avaliações (ex: 'Muito Positivas', 'Neutras'). Se não for encontrado, use null."
                    },
                    developer: {
                        type: "string",
                        description: "Nome da desenvolvedora principal. Se não for encontrado, use null."
                    },
                    publisher: {
                        type: "string",
                        description: "Nome da distribuidora principal. Se não for encontrado, use null."
                    },
                    capsuleImageUrl: {
                        type: "string",
                        description: "URL da imagem da cápsula (capa) do jogo na Steam. Se não for encontrada, use null."
                    },
                    source: {
                        type: "string",
                        description: "Fonte principal da informação (ex: Steam, PlayStation Store)."
                    }
                },
                required: ["name", "launchDate", "suggestedPrice", "priceUSD", "reviewCount", "reviewSummary", "developer", "publisher", "capsuleImageUrl", "source"]
            }
        }
    },
    required: ["results"]
};

const SYSTEM_PROMPT = (gameName: string) => `Você é um assistente de busca de dados de jogos. Sua tarefa é buscar na web (usando a ferramenta Google Search) e retornar uma lista de 3 a 5 resultados de jogos que correspondam ao termo de busca "${gameName}".

Instruções Críticas:
1. Use a ferramenta Google Search para encontrar informações públicas sobre o jogo. **Foque estritamente em plataformas de distribuição de jogos grandes como Steam, Xbox, PlayStation, Nintendo, Epic Games, Google Play ou App Store.** Ignore resultados de blogs, notícias ou fóruns, a menos que sejam a única fonte de informação.
2. Para cada resultado, forneça o nome, a data de lançamento (YYYY-MM-DD, ou null), o preço sugerido em BRL (Reais, ou 0), o preço em USD (ou 0), o número de avaliações, o resumo da classificação, a desenvolvedora, a distribuidora e a URL da imagem da cápsula (capa).
3. O objeto JSON de saída DEVE aderir estritamente ao esquema fornecido.
4. Sua resposta DEVE ser APENAS o objeto JSON. Não inclua texto explicativo ou markdown blocks (como \`\`\`json).

Esquema JSON de Saída: ${JSON.stringify(JSON_SCHEMA)}`;

async function callGeminiWebSearch(aiApiKey: string, gameName: string): Promise<any> {
    // Usando a chave como query parameter
    const url = `${GEMINI_API_URL}?key=${aiApiKey}`;
    
    const prompt = SYSTEM_PROMPT(gameName);

    const body = {
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }],
        // Removendo generationConfig para permitir o uso de tools
        tools: [{ googleSearch: {} }], // Ferramenta de busca
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let responseJson;

    try {
        responseJson = JSON.parse(responseText);
    } catch {
        throw new Error(`Resposta inválida da API Gemini. Status: ${response.status}. Resposta bruta: ${responseText.substring(0, 200)}...`);
    }


    if (!response.ok) {
        const errorDetail = responseJson.error?.message || responseJson.error || 'Erro desconhecido na API do Gemini.';
        throw new Error(`Falha na API Gemini (Status ${response.status}): ${errorDetail}`);
    }

    const content = responseJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!content) {
        throw new Error("A IA (Gemini) não retornou conteúdo JSON válido.");
    }
    
    try {
        // Tenta analisar o JSON retornado
        return JSON.parse(content);
    } catch {
        // Se falhar, tenta limpar o conteúdo (removendo markdown blocks)
        const cleanedContent = content.replace(/```json\s*|```/g, '').trim();
        try {
            return JSON.parse(cleanedContent);
        } catch {
            throw new Error(`A IA retornou JSON malformado: ${content.substring(0, 200)}...`);
        }
    }
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

    // Retorna a lista de resultados
    return new Response(JSON.stringify(structuredData), {
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