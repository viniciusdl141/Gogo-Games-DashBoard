import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock function updated to receive and acknowledge the API key
function mockAIProcess(rawData: string, gameName: string, aiApiKey: string): any {
    // ⚠️ ATENÇÃO: Em produção, você deve substituir este mock pela chamada real à API de IA (ex: OpenAI, Gemini).
    // O prompt deve instruir a IA a retornar um JSON que corresponda às interfaces de trackingData.ts.
    
    console.log(`Simulando processamento de IA para o jogo: ${gameName}. Dados brutos recebidos.`);
    console.log(`Chave da API recebida (Primeiros 5 caracteres): ${aiApiKey.substring(0, 5)}...`);

    // --- INÍCIO DA LÓGICA REAL DA IA ---
    // Aqui é onde você inicializaria o cliente da IA usando a chave fornecida:
    /*
    // Exemplo de inicialização do cliente OpenAI (requer importação e configuração corretas para Deno)
    // const openai = new OpenAI({ apiKey: aiApiKey });
    // const response = await openai.chat.completions.create({
    //     model: "gpt-4o-mini",
    //     messages: [{ role: "user", content: `Process the following raw data for game ${gameName} and return a JSON array matching the trackingData structure: ${rawData}` }],
    //     response_format: { type: "json_object" },
    // });
    // const structuredData = JSON.parse(response.choices[0].message.content);
    // return structuredData;
    */
    // --- FIM DA LÓGICA REAL DA IA ---

    // Retorna um mock de dados para que o frontend possa testar a integração
    const mockEntry = {
        id: `mock-${Date.now()}`,
        date: new Date().toISOString(),
        game: gameName,
        wishlists: rawData.length > 50 ? 500 : 100, // Mock logic based on input size
        sales: rawData.length > 50 ? 10 : 5,
        platform: 'Steam',
        variation: 5,
        saleType: 'Padrão',
        frequency: 'Diário',
    };

    return {
        influencerTracking: [],
        eventTracking: [],
        paidTraffic: [],
        wlSales: [mockEntry], 
        demoTracking: [],
        trafficTracking: [],
        manualEventMarkers: [],
    };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Recebe a nova chave aiApiKey
    const { rawData, gameName, aiApiKey } = await req.json();

    if (!rawData || !gameName || !aiApiKey) {
      return new Response(JSON.stringify({ error: 'Missing rawData, gameName, or aiApiKey' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Autenticação (Recomendado: verificar o JWT do usuário aqui)
    // ...

    // 2. Processar dados usando mock AI (que agora recebe a chave)
    const structuredData = mockAIProcess(rawData, gameName, aiApiKey);

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