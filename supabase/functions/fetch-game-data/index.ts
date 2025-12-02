import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@0.15.0"; // Usando a versão 0.15.0

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define o esquema de saída esperado pela IA para a busca de jogos
const gameDataSchema = {
    type: "object",
    properties: {
        results: {
            type: "array",
            description: "Lista de jogos encontrados que correspondem ao nome da busca.",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Nome completo do jogo." },
                    launchDate: { type: "string", description: "Data de lançamento (YYYY-MM-DD)." },
                    suggestedPrice: { type: "number", description: "Preço sugerido em BRL." },
                    priceUSD: { type: "number", description: "Preço sugerido em USD." },
                    reviewCount: { type: "number", description: "Contagem total de reviews." },
                    reviewSummary: { type: "string", description: "Classificação de reviews (ex: Muito Positiva)." },
                    developer: { type: "string", description: "Nome da desenvolvedora." },
                    publisher: { type: "string", description: "Nome da publicadora." },
                    capsuleImageUrl: { type: "string", description: "URL da imagem cápsula do jogo." },
                    source: { type: "string", description: "Fonte dos dados (ex: Steam)." },
                },
                required: ["name", "launchDate", "suggestedPrice", "priceUSD", "reviewCount", "reviewSummary", "developer", "publisher", "capsuleImageUrl", "source"],
            },
        },
    },
    required: ["results"],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  try {
    const { gameName, aiApiKey } = await req.json();

    if (!gameName || !aiApiKey) {
      return new Response(JSON.stringify({ error: 'Missing gameName or aiApiKey' }), { status: 400, headers: corsHeaders });
    }

    // Initialize Gemini client with the user-provided key
    const ai = new GoogleGenAI({ apiKey: aiApiKey });

    // Prompt para simular a busca de dados de jogos na web
    const prompt = `
        Você é um assistente de busca de dados de jogos. Sua tarefa é simular a busca na web por dados públicos do jogo "${gameName}" e retornar as informações mais relevantes para estimativa de vendas.

        **Instruções:**
        1. **Simulação de Busca:** Simule a busca por 1 a 3 resultados que correspondam ao nome do jogo.
        2. **Dados Relevantes:** Para cada resultado, forneça o nome, data de lançamento, preço em BRL e USD, contagem e resumo de reviews, desenvolvedora, publicadora e uma URL de imagem cápsula (simulada).
        3. **Estrutura de Saída:** O resultado DEVE ser um objeto JSON que adere estritamente ao esquema fornecido (GameDataSchema).

        **Exemplo de Dados Simulados para "${gameName}":**
        - Nome: ${gameName}
        - Data de Lançamento: 2024-05-15
        - Preço BRL: 49.99
        - Preço USD: 9.99
        - Reviews: 500
        - Resumo: Positiva
        - Desenvolvedora: Studio Alpha
        - Publicadora: GoGo Games
        - Imagem: https://picsum.photos/seed/${gameName.replace(/\s/g, '')}/200/100
        - Fonte: Steam

        Gere o resultado em formato JSON estrito.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: gameDataSchema,
        },
    });

    const jsonText = response.text.trim();
    const structuredResponse = JSON.parse(jsonText);

    return new Response(JSON.stringify(structuredResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in fetch-game-data:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});