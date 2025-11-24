import { supabase } from './client';

export interface Profile {
    id: string;
    email: string;
    role: 'admin' | 'user';
    studio_id: string | null;
    created_at: string;
}

export const getProfiles = async (): Promise<Profile[]> => {
  // RLS ensures only admins can read all profiles
  const { data, error } = await supabase.from('profiles').select('*').order('email');
  if (error) throw error;
  return data as Profile[];
};

export const updateProfile = async (id: string, updates: Partial<Omit<Profile, 'id' | 'created_at' | 'email'>>): Promise<Profile> => {
  // RLS ensures only admins or the user themselves can update
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Profile;
};