import { supabase } from './client';

export interface Game {
  id: string;
  name: string;
  launch_date: string | null; // ISO date string 'YYYY-MM-DD'
  suggested_price: number | null; // New field
  capsule_image_url: string | null; // NEW FIELD
  studio_id: string | null; // NEW FIELD
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

export const addGame = async (name: string, launch_date: string | null, suggested_price: number | null = null, capsule_image_url: string | null = null, studio_id: string | null = null): Promise<Game> => {
  const { data, error } = await supabase.from('games').insert([{ name, launch_date, suggested_price, capsule_image_url, studio_id }]).select().single();
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