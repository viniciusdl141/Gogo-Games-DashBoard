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
  email?: string; // Adicionado para uso no Admin
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
  // Use .maybeSingle() to handle 0 or 1 result gracefully without throwing an error on 'no rows found'
  const { data, error } = await supabase.from('studios').select('*').eq('owner_id', ownerId).maybeSingle();
  
  if (error) throw error;
  
  return data as Studio | null;
};

export const createStudio = async (name: string, ownerId: string): Promise<Studio> => {
  const { data, error } = await supabase.from('studios').insert([{ name, owner_id: ownerId }]).select().single();
  if (error) throw error;
  return data;
};

// NEW: Function to call the SQL function to create the Gogo Studio
export const createGogoStudioIfMissing = async (): Promise<string | null> => {
    const { data, error } = await supabase.rpc('create_gogo_studio_if_missing');
    if (error) {
        console.error("Error calling create_gogo_studio_if_missing:", error);
        throw error;
    }
    return data as string | null; // Returns the studio ID or null
};


export const getProfile = async (userId: string): Promise<Profile | null> => {
  // Use .maybeSingle() to handle 0 or 1 result gracefully without throwing an error on 'no rows found'
  const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, is_admin').eq('id', userId).maybeSingle();
  
  if (error) throw error;
  
  return data as Profile | null;
};

export const createProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase.from('profiles').insert([{ id: userId, is_admin: false }]).select().single();
  if (error) throw error;
  return data;
};

// --- Admin Functions ---

export const getAllProfiles = async (): Promise<Profile[]> => {
  // Fetch only profile data. We cannot reliably fetch email via RLS from auth.users here.
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      is_admin
    `);
  
  if (error) throw error;
  
  // NOTE: Email will be 'N/A' in the Admin panel unless we implement a separate mechanism to fetch it.
  return data.map(p => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    is_admin: p.is_admin,
    email: 'N/A (Admin RLS restriction)',
  }));
};

export const getAllStudios = async (): Promise<Studio[]> => {
  const { data, error } = await supabase.from('studios').select('*').order('name');
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

export const getAllGames = async (): Promise<Game[]> => {
  // This function is intended for Admin to see ALL games, regardless of studio_id
  // RLS policy for 'games' must allow admin to read all.
  const { data, error } = await supabase.from('games').select('*').order('name');
  if (error) throw error;
  return data;
};

export const updateProfileAdminStatus = async (userId: string, isAdmin: boolean): Promise<void> => {
  const { error } = await supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', userId);
  if (error) throw error;
};