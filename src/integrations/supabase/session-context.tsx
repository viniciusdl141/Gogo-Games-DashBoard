"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './client';
import { Profile } from '@/data/trackingData'; // Assuming Profile type is defined here or needs to be created

// Define the expected structure for the session context
export interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  studioId: string | null;
  isLoading: boolean;
}

// Initial state for the context
const initialContext: SessionContextType = {
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  studioId: null,
  isLoading: true,
};

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionContextProviderProps {
  children: ReactNode;
}

/**
 * Provides the Supabase session, user, profile, and derived properties (isAdmin, studioId)
 * to the rest of the application.
 */
export const SessionContextProvider: React.FC<SessionContextProviderProps> = ({ children }) => {
  const [state, setState] = useState<SessionContextType>(initialContext);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error);
      }
      await updateSessionState(session);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      updateSessionState(session);
    });

    fetchSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateSessionState = async (session: Session | null) => {
    let user: User | null = session?.user || null;
    let profile: Profile | null = null;
    let isAdmin: boolean = false;
    let studioId: string | null = null;

    if (user) {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching profile:", profileError);
      } else if (profileData) {
        profile = profileData as Profile;
        isAdmin = profile.role === 'admin';
        studioId = profile.studio_id || null;
      }
    }

    setState({
      session,
      user,
      profile,
      isAdmin,
      studioId,
      isLoading: false,
    });
  };

  return (
    <SessionContext.Provider value={state}>
      {children}
    </SessionContext.Provider>
  );
};