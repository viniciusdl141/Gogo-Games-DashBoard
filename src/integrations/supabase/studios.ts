import { supabase } from './client';
import { Studio } from '@/types/supabase';

export const getStudios = async (): Promise<Studio[]> => {
  const { data, error } = await supabase.from('studios').select('*').order('name');
  if (error) throw error;
  return data as Studio[];
};

export const createStudio = async (name: string, owner_id: string | null): Promise<Studio> => {
  const { data, error } = await supabase.from('studios').insert([{ name, owner_id }]).select().single();
  if (error) throw error;
  return data as Studio;
};

export const deleteStudio = async (id: string): Promise<void> => {
  const { error } = await supabase.from('studios').delete().eq('id', id);
  if (error) throw error;
};

export const updateProfileStudio = async (profileId: string, studioId: string | null): Promise<void> => {
  const { error } = await supabase.from('profiles').update({ studio_id: studioId }).eq('id', profileId);
  if (error) throw error;
};