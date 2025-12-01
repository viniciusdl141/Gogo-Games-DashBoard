import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get the Gemini API Key from the environment secrets
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-2.5-flash'; // Using a fast model for data processing

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Authentication Check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Initialize Supabase client with the user's JWT
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  // Get the user's ID to ensure RLS compliance
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token or user session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // 2. Parse Request Body
  let steamJson;
  try {
    const body = await req.json();
    steamJson = body.steamJson;
    if (!steamJson) {
      throw new Error('Missing steamJson in request body.');
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload or missing steamJson field.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set.');
    return new Response(JSON.stringify({ error: 'Server configuration error: Gemini API Key missing.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Define the desired output schema for the game data
  const outputSchema = {
    type: "object",
    properties: {
      name: { type: "string", description: "The official name of the game." },
      launch_date: { type: "string", format: "date", description: "The estimated or actual launch date in YYYY-MM-DD format." },
      suggested_price: { type: "number", description: "The suggested price in USD (e.g., 19.99)." },
      capsule_image_url: { type: "string", description: "The URL of the main capsule image." },
      developer: { type: "string", description: "The primary developer name." },
      publisher: { type: "string", description: "The primary publisher name." },
      review_summary: { type: "string", description: "A brief, one-sentence summary of the game's reviews or description." },
      category: { type: "string", description: "The main genre or category of the game (e.g., Action, RPG, Strategy)." },
    },
    required: ["name", "launch_date", "suggested_price", "developer", "publisher", "category"],
  };

  const prompt = `You are an expert data processor. Analyze the following raw JSON data from a Steamworks page. Extract the relevant information and structure it strictly according to the provided JSON schema. If a field is missing, use your best judgment to infer a reasonable value based on the context, or use a placeholder if inference is impossible (e.g., 'TBD' for developer if not found). The output MUST be a valid JSON object that conforms exactly to the schema.

Raw Steamworks JSON Data:
${JSON.stringify(steamJson, null, 2)}
`;

  // 4. Call Gemini API
  let geminiResponse;
  try {
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const geminiReqBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: outputSchema,
      },
    };

    const response = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiReqBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      throw new Error(`Gemini API failed with status ${response.status}`);
    }

    geminiResponse = await response.json();
  } catch (e) {
    console.error('Error calling Gemini API:', e.message);
    return new Response(JSON.stringify({ error: 'Failed to process data with AI.', details: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 5. Extract and Validate AI Output
  let processedGameData;
  try {
    // The response structure for JSON output is complex, we need to parse the text part
    const jsonText = geminiResponse.candidates[0].content.parts[0].text.trim();
    processedGameData = JSON.parse(jsonText);
    
    // Add the user's studio_id to the data for RLS compliance
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('studio_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData.studio_id) {
        console.error('Profile or Studio ID not found:', profileError?.message);
        return new Response(JSON.stringify({ error: 'Could not retrieve user studio information.' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    processedGameData.studio_id = profileData.studio_id;

  } catch (e) {
    console.error('Error parsing AI output or retrieving studio ID:', e.message);
    return new Response(JSON.stringify({ error: 'AI returned invalid or unparsable JSON.', details: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 6. Insert Data into Supabase
  try {
    const { data, error } = await supabase
      .from('games')
      .insert([processedGameData])
      .select()
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error.message);
      throw new Error(error.message);
    }

    // 7. Return the processed data (preview)
    return new Response(JSON.stringify({ 
      message: 'Game data processed and inserted successfully.', 
      preview: data 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Database operation failed:', e.message);
    return new Response(JSON.stringify({ error: 'Failed to insert data into the database.', details: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});