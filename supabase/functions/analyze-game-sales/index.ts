import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Tentando a versão 0.15.0, que pode ser mais estável no ambiente Deno/Supabase.
import { GoogleGenAI } from "npm:@google/genai@0.15.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define o esquema de saída esperado pela IA
const salesAnalysisSchema = {
    type: "object",
    properties: {
        gameName: { type: "string", description: "Nome do jogo analisado." },
        launchDate: { type: "string", description: "Data de lançamento (YYYY-MM-DD)." },
        timeSinceLaunch: { type: "string", description: "Tempo desde o lançamento (ex: '6 meses')." },
        totalMonths: { type: "number", description: "Total de meses desde o lançamento." },
        reviews: { type: "number", description: "Contagem total de reviews." },
        priceBRL: { type: "number", description: "Preço sugerido em BRL." },
        priceUSD: { type: "number", description: "Preço sugerido em USD." },
        tags: { type: "array", items: { type: "string" }, description: "Tags/Gêneros principais." },
        ccuPeak: { type: "number", description: "Pico de jogadores simultâneos (CCU)." },
        ccuPeakDate: { type: "string", description: "Data do pico de CCU (YYYY-MM-DD)." },
        ccuCurrent: { type: "number", description: "Jogadores simultâneos atuais." },
        estimationResults: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    method: { type: "string", description: "Nome do método (ex: Boxleiter 40x, VG Insights Genre)." },
                    logic: { type: "string", description: "Fórmula ou lógica usada para o cálculo." },
                    multiplier: { type: "number", description: "Multiplicador usado (ex: 40)." },
                    estimatedSales: { type: "number", description: "Vendas estimadas por este método." },
                },
                required: ["method", "logic", "multiplier", "estimatedSales"],
            },
            description: "Resultados de estimativas de vendas usando 3 a 5 métodos diferentes (Boxleiter, CCU, etc.).",
        },
        averageSales: { type: "number", description: "Média das vendas estimadas." },
        temporalAnalysis: {
            type: "object",
            properties: {
                averageSpeed: { type: "string", description: "Velocidade média de vendas por mês." },
                peakMomentInterpretation: { type: "string", description: "Interpretação do pico de CCU e lançamento." },
                verdict: { type: "string", description: "Veredito geral sobre a performance de vendas (ex: 'Forte', 'Lenta')." },
            },
            required: ["averageSpeed", "peakMomentInterpretation", "verdict"],
        },
        analystNotes: {
            type: "object",
            properties: {
                conflictExplanation: { type: "string", description: "Explicação se houver grande conflito entre os métodos de estimativa." },
                conclusion: { type: "string", description: "Conclusão final e recomendação estratégica." },
            },
            required: ["conflictExplanation", "conclusion"],
        },
    },
    required: ["gameName", "launchDate", "reviews", "priceBRL", "priceUSD", "tags", "ccuPeak", "estimationResults", "averageSales", "temporalAnalysis", "analystNotes"],
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

    // Prompt para a IA
    const prompt = `
        Você é um Analista de Mercado de Jogos Sênior. Sua tarefa é analisar o jogo "${gameName}" usando dados públicos da Steam (simulados abaixo) e gerar um relatório estruturado de estimativas de vendas e sucesso.

        **Instruções de Análise:**
        1. **Busca de Dados Públicos (Simulada):** Simule a busca de dados públicos para o jogo "${gameName}". Use valores realistas para um jogo indie de sucesso moderado a forte.
        2. **Metodologias de Estimativa:** Calcule as vendas estimadas usando pelo menos 4 metodologias de mercado conhecidas (Boxleiter Method, CCU Peak Multiplier, VG Insights Genre Multiplier, etc.).
        3. **Estrutura de Saída:** O resultado DEVE ser um objeto JSON que adere estritamente ao esquema fornecido (SalesAnalysisReport).

        **Dados Simulados para Análise de "${gameName}":**
        - Data de Lançamento: 2023-10-27
        - Preço (BRL): 39.99
        - Preço (USD): 7.99
        - Reviews Totais: 1200
        - Classificação: Muito Positiva (90%+)
        - Tags/Gêneros: ['Ação', 'Roguelite', 'Pixel Art', 'Indie']
        - Pico de CCU (Jogadores Simultâneos): 4500
        - Data do Pico de CCU: 2023-11-01
        - CCU Atual: 150

        **Multiplicadores de Exemplo (Use estes para os cálculos):**
        - Boxleiter (40x): Vendas = Reviews * 40
        - Boxleiter (60x): Vendas = Reviews * 60
        - CCU Peak (25x): Vendas = CCU Peak * 25
        - CCU Peak (50x): Vendas = CCU Peak * 50

        Gere o relatório de análise de vendas completo em português, aderindo estritamente ao esquema JSON.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: salesAnalysisSchema,
        },
    });

    const jsonText = response.text.trim();
    const structuredReport = JSON.parse(jsonText);

    return new Response(JSON.stringify(structuredReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in analyze-game-sales:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});