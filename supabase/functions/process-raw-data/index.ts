import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Importa a biblioteca Gemini
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.15.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Define o esquema de saída JSON esperado pela IA
const structuredDataSchema = {
    type: "object",
    properties: {
        influencerTracking: {
            type: "array",
            description: "Lista de entradas de tracking de influencers.",
            items: {
                type: "object",
                properties: {
                    date: { type: "string", format: "date", description: "Data da ação (YYYY-MM-DD)." },
                    game: { type: "string", description: "Nome do jogo." },
                    influencer: { type: "string" },
                    platform: { type: "string", enum: ["Youtube", "Tiktok", "Instagram", "Facebook", "Twitch", "Outro"] },
                    action: { type: "string", enum: ["Video", "Live", "Shorts", "Reels", "Comentarios + CTA", "Review", "Outro"] },
                    contentType: { type: "string", enum: ["Análise e recomendação", "GamePlay", "Video Curto", "Live", "Shorts", "Reels", "Outro"] },
                    views: { type: "number", description: "Visualizações alcançadas." },
                    investment: { type: "number", description: "Investimento em R$." },
                    estimatedWL: { type: "number", description: "Wishlists estimadas." },
                    observations: { type: "string", description: "Observações adicionais." },
                },
                required: ["date", "game", "influencer", "platform", "action", "contentType", "views", "investment", "estimatedWL"],
            },
        },
        eventTracking: {
            type: "array",
            description: "Lista de entradas de tracking de eventos.",
            items: {
                type: "object",
                properties: {
                    startDate: { type: "string", format: "date", description: "Data de início (YYYY-MM-DD)." },
                    endDate: { type: "string", format: "date", description: "Data final (YYYY-MM-DD)." },
                    event: { type: "string", description: "Nome do evento." },
                    game: { type: "string", description: "Nome do jogo." },
                    action: { type: "string", enum: ["KeyMailer", "Participação presencial", "Virtual", "Outro"] },
                    cost: { type: "number", description: "Custo de participação em R$." },
                    wlGenerated: { type: "number", description: "Wishlists geradas." },
                    views: { type: "number", description: "Visualizações alcançadas." },
                },
                required: ["startDate", "endDate", "event", "game", "action", "cost", "wlGenerated", "views"],
            },
        },
        paidTraffic: {
            type: "array",
            description: "Lista de entradas de tráfego pago.",
            items: {
                type: "object",
                properties: {
                    game: { type: "string", description: "Nome do jogo." },
                    network: { type: "string", enum: ["Meta", "Reddit", "Youtube", "Tiktok", "Google Ads", "Outro"] },
                    startDate: { type: "string", format: "date", description: "Data de início (YYYY-MM-DD)." },
                    endDate: { type: "string", format: "date", description: "Data final (YYYY-MM-DD)." },
                    impressions: { type: "number" },
                    clicks: { type: "number" },
                    investedValue: { type: "number", description: "Valor investido em R$." },
                    estimatedWishlists: { type: "number", description: "Wishlists estimadas." },
                },
                required: ["game", "network", "startDate", "endDate", "impressions", "clicks", "investedValue", "estimatedWishlists"],
            },
        },
        wlSales: {
            type: "array",
            description: "Lista de entradas de Wishlists e Vendas diárias/periódicas.",
            items: {
                type: "object",
                properties: {
                    date: { type: "string", format: "date", description: "Data da entrada (YYYY-MM-DD)." },
                    platform: { type: "string", enum: ["Steam", "Xbox", "Playstation", "Nintendo", "Android", "iOS", "Epic Games", "Outra"] },
                    wishlists: { type: "number", description: "Total de Wishlists na data." },
                    sales: { type: "number", description: "Vendas (unidades) na data." },
                    saleType: { type: "string", enum: ["Padrão", "Bundle", "DLC"], description: "Tipo de venda." },
                    frequency: { type: "string", enum: ["Diário", "Semanal", "Mensal"], description: "Frequência da entrada." },
                },
                required: ["date", "platform", "wishlists", "sales"],
            },
        },
        demoTracking: {
            type: "array",
            description: "Lista de entradas de tracking de demo.",
            items: {
                type: "object",
                properties: {
                    date: { type: "string", format: "date", description: "Data da entrada (YYYY-MM-DD)." },
                    downloads: { type: "number" },
                    avgPlaytime: { type: "string", description: "Tempo médio de jogo na demo (ex: '15 Min')." },
                    totalDemoTime: { type: "string", description: "Tempo total da demo (ex: '20-30 minutos')." },
                    totalGameTime: { type: "string", description: "Tempo total do jogo (ex: '4 horas')." },
                },
                required: ["date", "downloads", "avgPlaytime", "totalDemoTime", "totalGameTime"],
            },
        },
        trafficTracking: {
            type: "array",
            description: "Lista de entradas de tráfego/visitas manuais.",
            items: {
                type: "object",
                properties: {
                    platform: { type: "string", enum: ["Steam", "Xbox", "Playstation", "Nintendo", "Android", "iOS", "Epic Games", "Outra"] },
                    source: { type: "string", description: "Fonte do tráfego (ex: 'Steam Analytics')." },
                    startDate: { type: "string", format: "date", description: "Data de início (YYYY-MM-DD)." },
                    endDate: { type: "string", format: "date", description: "Data final (YYYY-MM-DD)." },
                    visits: { type: "number", description: "Total de visitas/page views." },
                    impressions: { type: "number", description: "Total de impressões." },
                    clicks: { type: "number", description: "Total de cliques." },
                },
                required: ["platform", "source", "startDate", "endDate", "visits"],
            },
        },
        manualEventMarkers: {
            type: "array",
            description: "Lista de marcadores de eventos manuais (promoções, lançamentos, etc.).",
            items: {
                type: "object",
                properties: {
                    date: { type: "string", format: "date", description: "Data do evento (YYYY-MM-DD)." },
                    name: { type: "string", description: "Nome do evento/ação." },
                },
                required: ["date", "name"],
            },
        },
    },
    required: ["influencerTracking", "eventTracking", "paidTraffic", "wlSales", "demoTracking", "trafficTracking", "manualEventMarkers"],
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawData, gameName, aiApiKey, aiProvider } = await req.json();

    if (!rawData || !gameName || !aiApiKey || aiProvider !== 'gemini') {
      return new Response(JSON.stringify({ error: "Dados de entrada inválidos ou provedor de IA não suportado." }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const ai = new GoogleGenAI(aiApiKey);
    
    const prompt = `
        Você é um assistente de análise de dados de marketing de jogos. Sua tarefa é extrair e estruturar dados de tracking de marketing e vendas de jogos a partir do texto bruto fornecido.
        
        O jogo alvo é: ${gameName}.
        
        Instruções:
        1. Analise o texto bruto fornecido abaixo.
        2. Mapeie todas as informações relevantes para as estruturas JSON definidas no esquema.
        3. Converta todas as datas para o formato 'YYYY-MM-DD'. Se a data estiver em formato serial do Excel (número), converta-a. (Ex: 45823 -> 2025-06-20).
        4. Se um campo for numérico, garanta que ele seja um número (number) no JSON, não uma string.
        5. Se não houver dados para uma categoria (ex: paidTraffic), retorne um array vazio [].
        6. Use os valores de enum fornecidos no esquema para os campos 'platform', 'action', 'contentType', 'saleType', 'frequency'. Se um valor não se encaixar, use o mais próximo ou 'Outro'.
        
        Texto Bruto:
        ---
        ${rawData}
        ---
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: structuredDataSchema,
        },
    });

    // O Gemini retorna o JSON estruturado dentro de response.text
    const structuredJsonText = response.text.trim();
    
    let structuredData;
    try {
        structuredData = JSON.parse(structuredJsonText);
    } catch (e) {
        console.error("Failed to parse AI response JSON:", structuredJsonText);
        return new Response(JSON.stringify({ error: "A IA retornou um JSON malformado.", rawResponse: structuredJsonText }), {
            status: 500,
            headers: corsHeaders,
        });
    }

    return new Response(JSON.stringify({ structuredData }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error("Global Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});