import { supabase } from './client';

export interface Studio {
  id: string;
  name: string;
  created_at: string;
}

export const getStudios = async (): Promise<Studio[]> => {
  const { data, error } = await supabase.from('studios').select('*').order('name');
  if (error) throw error;
  return data;
};

export const addStudio = async (name: string): Promise<Studio> => {
  const { data, error } = await supabase.from('studios').insert([{ name }]).select().single();
  if (error) throw error;
  return data;
};

export const updateStudio = async (id: string, updates: Partial<Studio>): Promise<Studio> => {
  const { data, error } = await supabase.from('studios').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteStudio = async (id: string): Promise<void> => {
  const { error } = await supabase.from('studios').delete().eq('id', id);
  if (error) throw error;
};

// Função de atribuição/transferência de jogos (Admin only, handled by RLS)
export const assignGameToStudio = async (gameId: string, studioId: string): Promise<void> => {
    const { error } = await supabase
        .from('games')
        .update({ studio_id: studioId })
        .eq('id', gameId);
    
    if (error) throw error;
};

export const removeGameFromStudio = async (gameId: string): Promise<void> => {
    const { error } = await supabase
        .from('games')
        .update({ studio_id: null })
        .eq('id', gameId);
    
    if (error) throw error;
};