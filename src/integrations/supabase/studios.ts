import { supabase } from './client';

export interface Studio {
  id: string;
  name: string;
  created_at: string;
}

export const getStudios = async (): Promise<Studio[]> => {
  // Admin access is assumed via code control (SessionContextProvider)
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