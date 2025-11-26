import { supabase } from './client';
import { invokeGameDataFetcher, GameOption } from './functions'; // Import GameOption and fetcher

export interface Game {
  id: string;
  name: string;
  launch_date: string | null; // ISO date string 'YYYY-MM-DD'
  suggested_price: number | null; // New field
  capsule_image_url: string | null; // NEW FIELD
  studio_id: string | null; // NEW FIELD
  category: string | null; // NEW FIELD
  created_at: string;
}

export const getGames = async (studioId?: string | null): Promise<Game[]> => {
  let query = supabase.from('games').select('*');
  
  // Apply filtering only if studioId is provided and not null
  if (studioId) {
    query = query.eq('studio_id', studioId);
  }
  
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data;
};

export const addGame = async (name: string, launch_date: string | null, suggested_price: number | null = null, capsule_image_url: string | null = null, studio_id: string | null = null, category: string | null = null): Promise<Game> => {
  const { data, error } = await supabase.from('games').insert([{ name, launch_date, suggested_price, capsule_image_url, studio_id, category }]).select().single();
  if (error) throw error;
  return data;
};

export const updateGame = async (id: string, updates: Partial<Game>): Promise<Game> => {
  const { data, error } = await supabase.from('games').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteGame = async (id: string): Promise<void> => {
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw error;
};

// Hardcoded API Key for Gemini (used for web search)
const GEMINI_API_KEY = 'AIzaSyCao7UHpJgeYGExguqjvecUwdeztYhnxWU';

/**
 * Fetches game metadata from the web using AI and updates the Supabase record.
 * @returns The updated game object or null if no data was found.
 */
export const fetchAndSetGameMetadata = async (game: Game): Promise<Game | null> => {
    // NOTE: We are using the hardcoded key here, which is generally bad practice but required by the current setup.
    const { results } = await invokeGameDataFetcher(game.name, GEMINI_API_KEY);

    if (results.length === 0) {
        return null;
    }

    // Prioritize the first result found
    const bestMatch = results[0];

    const updates: Partial<Game> = {
        capsule_image_url: bestMatch.capsuleImageUrl || game.capsule_image_url,
        launch_date: bestMatch.launchDate || game.launch_date,
        suggested_price: bestMatch.suggestedPrice || game.suggested_price,
        category: bestMatch.category || game.category,
        // We don't update developer/publisher/priceUSD here as they are not stored in the main Game table, 
        // but they are useful for the WebSearchGameForm.
    };

    // Only update if there is at least one new piece of information
    if (Object.values(updates).some(v => v !== null && v !== undefined)) {
        // Ensure we only pass non-null values if they are meant to be updated
        const cleanUpdates: Partial<Game> = {};
        for (const key in updates) {
            const k = key as keyof Partial<Game>;
            if (updates[k] !== undefined) {
                cleanUpdates[k] = updates[k];
            }
        }
        
        return updateGame(game.id, cleanUpdates);
    }

    return null;
};