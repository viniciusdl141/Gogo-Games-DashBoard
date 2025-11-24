import { supabase } from './client';

export interface Game {
  id: string;
  name: string;
  launch_date: string | null; // ISO date string 'YYYY-MM-DD'
  suggested_price: number | null; // Price in BRL
  capsule_image_url: string | null; // Capsule image URL
  price_usd: number | null; // Price in USD
  developer: string | null; // Developer name
  publisher: string | null; // Publisher name
  review_summary: string | null; // Review classification summary
  studio_id: string | null; // NEW: Foreign key to studios
  created_at: string;
}

export const getGames = async (): Promise<Game[]> => {
  // RLS ensures only permitted games (admin or studio-specific) are returned
  const { data, error } = await supabase.from('games').select('*').order('name');
  if (error) throw error;
  return data;
};

export const addGame = async (name: string, launch_date: string | null, suggested_price: number | null = null, capsule_image_url: string | null = null, price_usd: number | null = null, developer: string | null = null, publisher: string | null = null, review_summary: string | null = null, studio_id: string | null = null): Promise<Game> => {
  const { data, error } = await supabase.from('games').insert([{ name, launch_date, suggested_price, capsule_image_url, price_usd, developer, publisher, review_summary, studio_id }]).select().single();
  if (error) throw error;
  return data;
};

export const updateGame = async (id: string, updates: Partial<Game>): Promise<Game> => {
  // RLS ensures only permitted games can be updated
  const { data, error } = await supabase.from('games').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteGame = async (id: string): Promise<void> => {
  // RLS ensures only permitted games can be deleted
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw error;
};