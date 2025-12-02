import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define a estrutura de saída esperada para a IA
const JSON_SCHEMA = {
  type: "object",
  properties: {
    games: {
      type: "array",
      items: {
        type: "object",
        properties: {
          appId: { type: "string", description: "O Steam App ID, se disponível." },
          name: { type: "string", description: "O nome do jogo." },
          wishlistDelta: { type: "number", description: "Mudança em wishlists durante um período, se presente." },
          followers: { type: "number", description: "Contagem total de seguidores, se presente." },
          tags: { type: "array", items: { type: "string" }, description: "Lista de tags de gênero." },
          reviews: { type: "string", description: "Resumo das avaliações (ex: 'Very Positive', 'Mixed')." },
          owners: { type: "string", description: "Faixa estimada de proprietários (ex: '100,000 - 200,000')." },
          price: { type: "number", description: "Preço atual em USD, se disponível." },
          releaseDate: { type: "string", description: "A data de lançamento no formato YYYY-MM-DD (ex: 2024-03-10), se disponível." },
        },
        required: ["name"],
      },
    },
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { json: rawJson, apiKey } = await req.json();

    if (!rawJson || !apiKey) {
      return new Response(JSON.stringify({ error: 'Missing raw JSON or API Key' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const prompt = \`Você é um extrator de dados especialista. Analise o seguinte JSON bruto, que foi raspado de ferramentas de análise do Steam. Extraia todas as informações relevantes para os jogos mencionados, focando especificamente em: nome, mudança de wishlist (wishlistDelta), seguidores, tags, resumo de reviews, proprietários estimados, preço e data de lançamento. Estruture a saída estritamente de acordo com o esquema JSON fornecido. Se um campo estiver faltando, omita-o ou defina-o como nulo, mas garanta que a saída seja um objeto JSON válido que corresponda ao esquema.

Raw Steam Scraper JSON Input:
---
\${rawJson}
---\`;

    const response = await fetch(\`\${GEMINI_API_URL}?key=\${apiKey}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: JSON_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return new Response(JSON.stringify({ error: \`Gemini API failed: \${response.statusText}\`, details: errorText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await response.json();
    
    // A resposta do Gemini geralmente contém o JSON estruturado como texto
    const jsonString = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonString) {
        return new Response(JSON.stringify({ error: 'A resposta do Gemini estava vazia ou malformada.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const structuredData = JSON.parse(jsonString);

    return new Response(JSON.stringify(structuredData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});