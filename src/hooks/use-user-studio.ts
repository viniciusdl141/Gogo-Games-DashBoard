"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { getStudioByOwner, getProfile, createProfile, Studio, Profile, createGogoStudioIfMissing } from '@/integrations/supabase/games';
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
      // 1. Fetch Profile (or create if missing)
      let userProfile = await getProfile(userId);
      
      if (!userProfile) {
          userProfile = await createProfile(userId);
          // No need for toast here, as the trigger should handle it, but keeping fallback
      }
      
      setProfile(userProfile);
      const isAdminUser = userProfile?.is_admin ?? false;

      // 2. Fetch Studio
      let userStudio = await getStudioByOwner(userId);

      // 3. If Admin and no studio, call the specific function to create the default studio
      if (!userStudio && isAdminUser) {
          const studioId = await createGogoStudioIfMissing();
          if (studioId) {
              userStudio = await getStudioByOwner(userId);
          }
      }
      
      // If still no studio, the user needs to go through onboarding (handled by App.tsx)
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