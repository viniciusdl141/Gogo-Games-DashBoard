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
      // 1. Fetch Profile
      const userProfile = await getProfile(userId);
      setProfile(userProfile);
      const isAdminUser = userProfile?.is_admin ?? false;

      // 2. Fetch Studio
      let userStudio = await getStudioByOwner(userId);

      // 3. Auto-create studio if needed (only for non-admins without a studio)
      if (!userStudio && !isAdminUser) {
        const defaultStudioName = session?.user?.email?.split('@')[0] || `Studio-${userId.substring(0, 8)}`;
        userStudio = await createStudio(defaultStudioName, userId);
        toast.info(`Estúdio padrão "${defaultStudioName}" criado.`);
      }
      
      setStudio(userStudio);

    } catch (error) {
      console.error("Error fetching studio/profile data:", error);
      
      // Se houver um erro, assumimos que o perfil/estúdio não pôde ser carregado
      // e definimos como null para evitar que o app trave.
      setStudio(null);
      setProfile(null);
      
      // Exibir um erro genérico apenas se o usuário estiver logado e o erro não for apenas 'no rows found'
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