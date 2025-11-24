import { supabase } from './client';

export interface Game {
  id: string;
  name: string;
  launch_date: string | null; // ISO date string 'YYYY-MM-DD'
  suggested_price: number | null; // New field
  capsule_image_url: string | null; // NEW FIELD
  studio_id: string | null; // NEW FIELD: Studio ID
  created_at: string;
}

export const getGames = async (): Promise<Game[]> => {
  // O RLS (Row Level Security) na tabela 'games' já garante que:
  // 1. Administradores vejam todos os jogos.
  // 2. Usuários autenticados vejam apenas jogos onde game.studio_id corresponde ao profiles.studio_id.
  // Portanto, basta selecionar todos os jogos e o Supabase fará a filtragem de segurança.
  const { data, error } = await supabase.from('games').select('*').order('name');
  if (error) throw error;
  return data as Game[];
};

export const addGame = async (name: string, launch_date: string | null, suggested_price: number | null = null, capsule_image_url: string | null = null, studio_id: string | null = null): Promise<Game> => {
  const { data, error } = await supabase.from('games').insert([{ name, launch_date, suggested_price, capsule_image_url, studio_id }]).select().single();
  if (error) throw error;
  return data as Game;
};

export const updateGame = async (id: string, updates: Partial<Game>): Promise<Game> => {
  const { data, error } = await supabase.from('games').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Game;
};

export const deleteGame = async (id: string): Promise<void> => {
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw error;
};