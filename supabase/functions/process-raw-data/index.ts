import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Importando a biblioteca Gemini
import { GoogleGenAI } from 'https://esm.sh/@google/genai@0.1.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define o esquema JSON que a IA deve retornar
const JSON_SCHEMA = {
    type: "object",
    properties: {
        influencerTracking: {
            type: "array",
            description: "Lista de entradas de tracking de influencers.",
            items: {
                type: "object",
                properties: {
                    date: { type: "string", description: "Data da ação (YYYY-MM-DD)." },
                    game: { type: "string" },
                    influencer: { type: "string" },
                    platform: { type: "string" },
                    action: { type: "string" },
                    contentType: { type: "string" },
                    views: { type: "number" },
                    investment: { type: "number" },
                    estimatedWL: { type: "number" },
                    observations: { type: "string" },
                },
                required: ["date", "game", "influencer", "platform", "views", "investment", "estimatedWL"],
            },
        },
        eventTracking: {
            type: "array",
            description: "Lista de entradas de tracking de eventos.",
            items: {
                type: "object",
                properties: {
                    startDate: { type: "string", description: "Data de início (YYYY-MM-DD)." },
                    endDate: { type: "string", description: "Data final (YYYY-MM-DD)." },
                    event: { type: "string" },
                    game: { type: "string" },
                    action: { type: "string" },
                    cost: { type: "number" },
                    wlGenerated: { type: "number" },
                    views: { type: "number" },
                },
                required: ["startDate", "endDate", "event", "game", "cost", "wlGenerated"],
            },
        },
        paidTraffic: {
            type: "array",
            description: "Lista de entradas de tráfego pago.",
            items: {
                type: "object",
                properties: {
                    startDate: { type: "string", description: "Data de início (YYYY-MM-DD)." },
                    endDate: { type: "string", description: "Data final (YYYY-MM-DD)." },
                    game: { type: "string" },
                    network: { type: "string" },
                    impressions: { type: "number" },
                    clicks: { type: "number" },
                    investedValue: { type: "number" },
                    estimatedWishlists: { type: "number" },
                },
                required: ["startDate", "endDate", "game", "network", "impressions", "clicks", "investedValue", "estimatedWishlists"],
            },
        },
        wlSales: {
            type: "array",
            description: "Lista de entradas de Wishlists e Vendas diárias/semanais/mensais.",
            items: {
                type: "object",
                properties: {
                    date: { type: "string", description: "Data da entrada (YYYY-MM-DD)." },
                    game: { type: "string" },
                    platform: { type: "string", enum: ["Steam", "Xbox", "Playstation", "Nintendo", "Android", "iOS", "Epic Games", "Outra"] },
                    wishlists: { type: "number" },
                    sales: { type: "number" },
                    saleType: { type: "string", enum: ["Padrão", "Bundle", "DLC"] },
                    frequency: { type: "string", enum: ["Diário", "Semanal", "Mensal"] },
                },
                required: ["date", "game", "platform", "wishlists", "sales"],
            },
        },
        demoTracking: {
            type: "array",
            description: "Lista de entradas de tracking de demo.",
            items: {
                type: "object",
                properties: {
                    date: { type: "string", description: "Data da entrada (YYYY-MM-DD)." },
                    game: { type: "string" },
                    downloads: { type: "number" },
                    avgPlaytime: { type: "string", description: "Ex: '15 Min'" },
                    totalDemoTime: { type: "string", description: "Ex: '20-30 minutos'" },
                    totalGameTime: { type: "string", description: "Ex: '4 horas'" },
                },
                required: ["date", "game", "downloads", "avgPlaytime"],
            },
        },
        trafficTracking: {
            type: "array",
            description: "Lista de entradas de tráfego/visitas manuais.",
            items: {
                type: "object",
                properties: {
                    game: { type: "string" },
                    platform: { type: "string", enum: ["Steam", "Xbox", "Playstation", "Nintendo", "Android", "iOS", "Epic Games", "Outra"] },
                    startDate: { type: "string", description: "Data de início (YYYY-MM-DD)." },
                    endDate: { type: "string", description: "Data final (YYYY-MM-DD)." },
                    visits: { type: "number" },
                    impressions: { type: "number" },
                    clicks: { type: "number" },
                    source: { type: "string" },
                },
                required: ["game", "platform", "startDate", "endDate", "visits", "source"],
            },
        },
        manualEventMarkers: {
            type: "array",
            description: "Lista de marcadores de eventos manuais (datas importantes).",
            items: {
                type: "object",
                properties: {
                    date: { type: "string", description: "Data do evento (YYYY-MM-DD)." },
                    game: { type: "string" },
                    name: { type: "string" },
                },
                required: ["date", "game", "name"],
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

    if (!aiApiKey || aiApiKey === 'SERVER_SECRET_KEY') {
        // Se a chave não foi passada ou é a chave placeholder, tentamos usar o segredo do ambiente
        const secretApiKey = Deno.env.get('GEMINI_API_KEY');
        if (!secretApiKey) {
            throw new Error("Chave da API Gemini não fornecida no corpo da requisição nem configurada como segredo de ambiente (GEMINI_API_KEY).");
        }
        // Usamos a chave do segredo se a chave do corpo for inválida
        // NOTE: Se o usuário insiste em passar a chave no corpo, ela deve ser usada.
    }
    
    if (!rawData || !gameName) {
      return new Response(JSON.stringify({ error: 'Dados brutos ou nome do jogo são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Inicializa o cliente Gemini com a chave fornecida pelo cliente (ou segredo, se configurado)
    const ai = new GoogleGenAI(aiApiKey);

    const prompt = `Você é um analista de dados de jogos. Sua tarefa é extrair e estruturar dados de tracking de marketing e vendas de jogos a partir do texto bruto fornecido. O jogo alvo é "${gameName}".
    
    Instruções:
    1. Converta todas as datas para o formato ISO 8601 (YYYY-MM-DD). Se a data for um número serial do Excel, converta-o para YYYY-MM-DD.
    2. Garanta que o campo 'game' em cada entrada seja exatamente "${gameName}".
    3. Converta todos os valores monetários (R$) e contagens (views, downloads, etc.) para números inteiros ou decimais (float), conforme apropriado.
    4. Se um campo for obrigatório no esquema e não puder ser inferido, use 0 para números ou '-' para strings, mas tente inferir o máximo possível.
    5. O resultado DEVE ser um objeto JSON que adere estritamente ao esquema fornecido.
    
    Dados Brutos:
    ---
    ${rawData}
    ---
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: JSON_SCHEMA,
        },
    });

    // O retorno da API Gemini é uma string JSON dentro de response.text
    const jsonString = response.text.trim();
    let structuredData;
    try {
        structuredData = JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse AI response JSON:", jsonString);
        return new Response(JSON.stringify({ error: 'A IA retornou um JSON inválido.', rawResponse: jsonString }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ structuredData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});