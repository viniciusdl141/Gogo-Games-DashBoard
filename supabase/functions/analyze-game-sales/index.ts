import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- JSON Schema for Output ---
const JSON_SCHEMA = {
    type: "object",
    properties: {
        gameName: { type: "string" },
        launchDate: { type: "string", description: "YYYY-MM-DD" },
        timeSinceLaunch: { type: "string", description: "Ex: 2 Anos e 3 Meses" },
        totalMonths: { type: "number", description: "Total de meses desde o lançamento" },
        reviews: { type: "number" },
        priceBRL: { type: "number" },
        priceUSD: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
        ccuPeak: { type: "number" },
        ccuPeakDate: { type: "string", description: "YYYY-MM-DD" },
        ccuCurrent: { type: "number", description: "CCU atual (se disponível, senão 0)" },
        
        estimationResults: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    method: { type: "string" },
                    logic: { type: "string" },
                    multiplier: { type: "number" },
                    estimatedSales: { type: "number" },
                },
                required: ["method", "logic", "multiplier", "estimatedSales"]
            }
        },
        averageSales: { type: "number" },
        
        temporalAnalysis: {
            type: "object",
            properties: {
                averageSpeed: { type: "string", description: "Ex: ~1500 cópias vendidas por mês" },
                peakMomentInterpretation: { type: "string", description: "Interpretação do pico (Hype inicial vs. Viral tardio)" },
                verdict: { type: "string", description: "Sprinter ou Marathoner" }
            },
            required: ["averageSpeed", "peakMomentInterpretation", "verdict"]
        },
        
        analystNotes: {
            type: "object",
            properties: {
                conflictExplanation: { type: "string", description: "Explicação da regra de conflito de gênero (Metodologia B)" },
                conclusion: { type: "string", description: "Resumo executivo sobre o sucesso financeiro." }
            },
            required: ["conflictExplanation", "conclusion"]
        }
    },
    required: ["gameName", "launchDate", "reviews", "priceBRL", "tags", "ccuPeak", "estimationResults", "averageSales", "temporalAnalysis", "analystNotes"]
};

const SYSTEM_PROMPT = (gameName: string) => `Você é um Analista Sênior de Mercado de Games (Steam Expert). Sua tarefa é buscar dados detalhados sobre o jogo "${gameName}" na Steam (usando a ferramenta Google Search) e aplicar as seguintes metodologias de estimativa de vendas e análise temporal.

Instruções Críticas:
1. **Busca de Dados:** Encontre Reviews Totais, Preço (BRL e USD), Tags/Gêneros Principais, Pico de Jogadores (CCU All-Time Peak), CCU Atual e Data de Lançamento Oficial.
2. **Cálculos:** Use os dados encontrados para preencher o esquema JSON, aplicando as fórmulas e regras lógicas abaixo.
3. **Formato de Saída:** Sua resposta DEVE ser APENAS o objeto JSON estritamente seguindo o esquema fornecido.

---
### 📐 FÓRMULAS E REGRAS LÓGICAS PARA CÁLCULO:

**METODOLOGIA A: Simulação Gamalytic (Foco no Preço)**
- Preço < R$ 25,00: Multiplicador = 20
- Preço R$ 30,00 a R$ 90,00: Multiplicador = 35
- Preço > R$ 100,00: Multiplicador = 50
- Vendas = Reviews * Multiplicador

**METODOLOGIA B: Simulação VG Insights (Foco no Gênero)**
- Multiplicadores Base:
    - Grupo Engajado (30x): Horror, RPG, Estratégia, Roguelike.
    - Grupo Leal (40x): Visual Novel, Anime, Plataforma.
    - Grupo Casual (55x): Simulator, Puzzle, Hidden Object.
    - Padrão: 35x.
- REGRA DE CONFLITO: Se houver tags de grupos diferentes, calcule a MÉDIA ARITMÉTICA dos multiplicadores envolvidos.
- Vendas = Reviews * Multiplicador Médio

**METODOLOGIA C: Simulação SteamDB (Foco no CCU)**
- Multiplayer/Co-op (Se tags incluem 'Multiplayer', 'Co-op', 'MMO'): CCU * 40
- Singleplayer (Caso contrário): CCU * 100
- Ajuste: Se o jogo tem >5 anos (60 meses) desde o lançamento, adicione +20% ao resultado final.
- Vendas = CCU * Multiplicador * (Ajuste Temporal)

**METODOLOGIA D: Análise Temporal (Velocidade)**
- Velocidade Média = (Média Geral de Vendas das 3 metodologias) / (Total de Meses desde o Lançamento)

---
**Esquema JSON de Saída:** ${JSON.stringify(JSON_SCHEMA)}`;

async function callGeminiWebSearchAndAnalyze(aiApiKey: string, gameName: string): Promise<any> {
    const url = `${GEMINI_API_URL}?key=${aiApiKey}`;
    
    const prompt = SYSTEM_PROMPT(gameName);

    const body = {
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }],
        tools: [{ googleSearch: {} }], // Habilita a ferramenta de busca
        config: {
            responseMimeType: "application/json",
            responseSchema: JSON_SCHEMA,
        }
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
        const errorDetail = responseJson.candidates?.[0]?.content?.parts?.[0]?.text || responseJson.error?.message || responseJson.error || 'Erro desconhecido na API do Gemini.';
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

    const structuredData = await callGeminiWebSearchAndAnalyze(aiApiKey, gameName);

    return new Response(JSON.stringify(structuredData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});