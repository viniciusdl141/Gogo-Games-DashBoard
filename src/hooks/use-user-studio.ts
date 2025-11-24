"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { getStudioByOwner, getProfile, createProfile, Studio, Profile, createGogoStudioIfMissing } from '@/integrations/supabase/games';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UserStudioState {
  studio: Studio | null;
  profile: Profile | null;
  isLoadingStudio: boolean;
  isAdmin: boolean;
  refetchStudio: () => void;
}

// Helper para buscar o estúdio pelo ID
const getStudioById = async (studioId: string): Promise<Studio | null> => {
    const { data, error } = await supabase.from('studios').select('*').eq('id', studioId).maybeSingle();
    if (error) {
        console.error("Error fetching studio by ID:", error);
        return null;
    }
    return data as Studio | null;
};


export function useUserStudio(): UserStudioState {
  const { session, isLoading: isLoadingSession } = useSession();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingStudio, setIsLoadingStudio] = useState(true);
  const userId = session?.user?.id;

  const fetchStudioData = useCallback(async () => {
    if (!userId) {
      setStudio(null);
      setProfile(null);
      setIsLoadingStudio(false);
      return;
    }

    setIsLoadingStudio(true);
    try {
      // 1. Fetch Profile (or create if missing)
      let userProfile = await getProfile(userId);
      
      if (!userProfile) {
          // This should ideally be handled by the trigger, but as a fallback:
          userProfile = await createProfile(userId);
      }
      
      setProfile(userProfile);
      const isAdminUser = userProfile?.is_admin ?? false;
      let userStudio: Studio | null = null;

      // 2. Handle Admin Studio Creation/Lookup
      if (isAdminUser) {
          // Admins always try to ensure the default studio exists and they own it
          const studioId = await createGogoStudioIfMissing();
          if (studioId) {
              userStudio = await getStudioById(studioId);
          }
      } 
      
      // 3. Lookup Studio via Profile Link (for non-admins or if admin doesn't own the default)
      if (!userStudio && userProfile?.studio_id) {
          userStudio = await getStudioById(userProfile.studio_id);
      }
      
      setStudio(userStudio);

    } catch (error) {
      console.error("Error fetching studio/profile data:", error);
      setStudio(null);
      setProfile(null);
      if (session) {
          toast.error("Falha ao carregar dados do estúdio/perfil. Verifique as permissões de RLS.");
      }
      
    } finally {
      setIsLoadingStudio(false);
    }
  }, [userId, session]);

  useEffect(() => {
    if (!isLoadingSession) {
      fetchStudioData();
    }
  }, [isLoadingSession, fetchStudioData]);

  const isAdmin = profile?.is_admin ?? false;

  return {
    studio,
    profile,
    isLoadingStudio,
    isAdmin,
    refetchStudio: fetchStudioData,
  };
}