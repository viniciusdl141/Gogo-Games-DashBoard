import { supabase } from './client';

export interface Game {
  id: string;
  name: string;
  launch_date: string | null; // ISO date string 'YYYY-MM-DD'
  suggested_price: number | null; // Price in BRL
  capsule_image_url: string | null; // Capsule image URL
  price_usd: number | null; // NEW: Price in USD
  developer: string | null; // NEW: Developer name
  publisher: string | null; // NEW: Publisher name
  review_summary: string | null; // NEW: Review classification summary
  studio_id: string | null; // NEW: Studio ID reference
  created_at: string;
}

export interface Studio {
  id: string;
  name: string;
  owner_id: string;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean;
}

export const getGames = async (): Promise<Game[]> => {
  // RLS ensures only accessible games are returned
  const { data, error } = await supabase.from('games').select('*').order('name');
  if (error) throw error;
  return data;
};

export const addGame = async (
  name: string, 
  launch_date: string | null, 
  suggested_price: number | null = null, 
  capsule_image_url: string | null = null, 
  price_usd: number | null = null, 
  developer: string | null = null, 
  publisher: string | null = null, 
  review_summary: string | null = null,
  studio_id: string | null = null // NEW PARAMETER
): Promise<Game> => {
  const { data, error } = await supabase.from('games').insert([{ 
    name, 
    launch_date, 
    suggested_price, 
    capsule_image_url, 
    price_usd, 
    developer, 
    publisher, 
    review_summary,
    studio_id // Include studio_id
  }]).select().single();
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

export const getStudioByOwner = async (ownerId: string): Promise<Studio | null> => {
  const { data, error } = await supabase.from('studios').select('*').eq('owner_id', ownerId).single();
  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    throw error;
  }
  return data;
};

export const createStudio = async (name: string, ownerId: string): Promise<Studio> => {
  const { data, error } = await supabase.from('studios').insert([{ name, owner_id: ownerId }]).select().single();
  if (error) throw error;
  return data;
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, is_admin').eq('id', userId).single();
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
};