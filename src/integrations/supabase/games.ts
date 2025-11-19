import { supabase } from './client';

export interface Game {
  id: string;
  name: string;
  launch_date: string | null; // ISO date string 'YYYY-MM-DD'
  created_at: string;
}

export const getGames = async (): Promise<Game[]> => {
  const { data, error } = await supabase.from('games').select('*').order('name');
  if (error) throw error;
  return data;
};

export const addGame = async (name: string, launch_date: string | null): Promise<Game> => {
  const { data, error } = await supabase.from('games').insert([{ name, launch_date }]).select().single();
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