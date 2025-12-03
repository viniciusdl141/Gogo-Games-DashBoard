import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.1.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Define the expected JSON schema for the output
const JSON_SCHEMA = {
  type: "object",
  properties: {
    influencerTracking: {
      type: "array",
      description: "Array de entradas de tracking de influencers.",
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
      description: "Array de entradas de tracking de eventos.",
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
      description: "Array de entradas de tráfego pago.",
      items: {
        type: "object",
        properties: {
          game: { type: "string" },
          network: { type: "string" },
          impressions: { type: "number" },
          clicks: { type: "number" },
          startDate: { type: "string", description: "Data de início (YYYY-MM-DD)." },
          endDate: { type: "string", description: "Data final (YYYY-MM-DD)." },
          investedValue: { type: "number" },
          estimatedWishlists: { type: "number" },
        },
        required: ["game", "network", "impressions", "clicks", "startDate", "endDate", "investedValue", "estimatedWishlists"],
      },
    },
    wlSales: {
      type: "array",
      description: "Array de entradas de Wishlists e Vendas diárias/periódicas.",
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
      description: "Array de entradas de tracking de demo.",
      items: {
        type: "object",
        properties: {
          date: { type: "string", description: "Data da entrada (YYYY-MM-DD)." },
          game: { type: "string" },
          downloads: { type: "number" },
          avgPlaytime: { type: "string" },
          totalDemoTime: { type: "string" },
          totalGameTime: { type: "string" },
        },
        required: ["date", "game", "downloads", "avgPlaytime"],
      },
    },
    trafficTracking: {
      type: "array",
      description: "Array de entradas de tráfego/visitas manuais.",
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
      description: "Array de marcadores de eventos manuais.",
      items: {
        type: "object",
        properties: {
          date: { type: "string", description: "Data do marcador (YYYY-MM-DD)." },
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

    if (!rawData || !gameName || !aiApiKey || aiProvider !== 'gemini') {
      return new Response(JSON.stringify({ error: 'Dados de entrada inválidos ou provedor de IA não suportado.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 1. Authentication Check (Optional but recommended for security)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { status: 401, headers: corsHeaders });
    }
    
    // Initialize Supabase client for auth verification (if needed)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );
    
    // Check if user is authenticated (optional, but good practice)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }), { status: 401, headers: corsHeaders });
    }

    // 2. Initialize Gemini Client
    const ai = new GoogleGenAI({ apiKey: aiApiKey });

    const prompt = `
      Você é um processador de dados de marketing de jogos. Sua tarefa é analisar o texto bruto fornecido abaixo e extrair todas as entradas de tracking relevantes para o jogo "${gameName}".
      
      O texto bruto pode conter dados de:
      - Tracking de Influencers (data, influencer, plataforma, views, investimento, WL estimadas).
      - Tracking de Eventos (período, evento, custo, WL geradas).
      - Tráfego Pago (período, rede, impressões, cliques, investimento, WL estimadas).
      - Wishlists e Vendas Diárias/Periódicas (data, WL total, vendas, plataforma, frequência).
      - Tracking de Demo (data, downloads, tempo médio de jogo).
      - Tráfego/Visitas Manuais (período, visitas, impressões, cliques, fonte).
      - Marcadores Manuais de Eventos (data, nome do evento).

      Converta todos os valores monetários e numéricos para o formato numérico (sem R$, sem vírgulas, sem pontos de milhar).
      Converta todas as datas para o formato ISO 8601 (YYYY-MM-DD). Se a data for um serial date do Excel, converta-a para YYYY-MM-DD.
      
      O jogo alvo é: "${gameName}". Filtre e estruture apenas os dados que se aplicam a este jogo.
      
      Retorne APENAS um objeto JSON que siga estritamente o schema fornecido. Se não houver dados para uma categoria, retorne um array vazio para essa chave.
      
      DADOS BRUTOS:
      ---
      ${rawData}
      ---
    `;

    // 3. Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: JSON_SCHEMA,
      },
    });

    const structuredData = JSON.parse(response.text);

    return new Response(JSON.stringify({ structuredData }), {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});