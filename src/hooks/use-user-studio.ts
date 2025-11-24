"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { getStudioByOwner, createStudio, getProfile, Studio, Profile } from '@/integrations/supabase/games';
import { toast } from 'sonner';

interface UserStudioState {
  studio: Studio | null;
  profile: Profile | null;
  isLoadingStudio: boolean;
  isAdmin: boolean;
  refetchStudio: () => void;
}

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
      // 1. Fetch Profile (to check admin status)
      const userProfile = await getProfile(userId);
      setProfile(userProfile);
      const isAdminUser = userProfile?.is_admin ?? false;

      // 2. Fetch Studio
      let userStudio = await getStudioByOwner(userId);

      // If no studio exists AND the user is NOT an admin, create a default studio entry
      // Admins don't strictly need a studio linked to their ID to operate, but if they don't have one, 
      // they won't see games linked only to their personal studio ID. We only auto-create for non-admins.
      if (!userStudio && !isAdminUser) {
        const defaultStudioName = session?.user?.email?.split('@')[0] || `Studio-${userId.substring(0, 8)}`;
        userStudio = await createStudio(defaultStudioName, userId);
        toast.info(`Estúdio padrão "${defaultStudioName}" criado.`);
      }
      
      setStudio(userStudio);

    } catch (error) {
      console.error("Error fetching studio/profile data:", error);
      // Only show error toast if it's not just a missing profile/studio (which should be handled internally)
      if (error.code !== 'PGRST116') {
        toast.error("Falha ao carregar dados do estúdio/perfil.");
      }
      setStudio(null);
      setProfile(null);
    } finally {
      setIsLoadingStudio(false);
    }
  }, [userId, session?.user?.email]);

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