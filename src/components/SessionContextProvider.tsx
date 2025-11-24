"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    is_admin: boolean;
    is_approved: boolean;
    studio_id: string | null;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refetchProfile: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User) => {
    if (!currentUser) {
        setProfile(null);
        return;
    }
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error("Error fetching profile:", error);
            setProfile(null);
        } else if (data) {
            setProfile(data as Profile);
        } else {
            // Se não encontrar perfil, pode ser um novo usuário que ainda não teve o trigger executado
            setProfile(null);
        }
    } catch (e) {
        console.error("Unexpected error fetching profile:", e);
        setProfile(null);
    }
  }, []);

  const refetchProfile = useCallback(() => {
      if (user) {
          fetchProfile(user);
      }
  }, [user, fetchProfile]);

  useEffect(() => {
    const loadSession = async () => {
        setIsLoading(true);
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        setSession(initialSession);
        setUser(initialSession?.user || null);
        
        if (initialSession?.user) {
            await fetchProfile(initialSession.user);
        } else {
            setProfile(null);
        }
        setIsLoading(false);
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          if (currentSession?.user) {
              // Se for SIGNED_IN, o Login.tsx já chama refetchProfile, mas garantimos aqui também
              fetchProfile(currentSession.user);
          }
      } else if (event === 'SIGNED_OUT') {
          setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <SessionContext.Provider value={{ session, user, profile, isLoading, refetchProfile }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};