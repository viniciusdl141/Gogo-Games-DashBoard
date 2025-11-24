import { supabase } from './client';
import { Profile } from '@/types/supabase';

export interface ProfileWithEmail extends Profile {
    email: string;
}

export const fetchProfilesForAdmin = async (): Promise<ProfileWithEmail[]> => {
    // Admins can read all profiles due to RLS policy.
    const { data, error } = await supabase
        .from('profiles')
        .select('*, auth_user:auth.users(email)')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(p => ({
        ...p,
        email: (p.auth_user as any)?.email || 'N/A',
    })) as ProfileWithEmail[];
};

export const updateProfileApprovalAndStudio = async (
    id: string, 
    is_approved: boolean, 
    studio_id: string | null, 
    is_admin: boolean
): Promise<Profile> => {
    const updates = { is_approved, studio_id, is_admin };
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Profile;
};