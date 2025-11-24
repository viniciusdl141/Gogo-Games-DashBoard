"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, Studio } from '@/types/supabase';

interface SessionContextType {
  session: Session | null;
  profile: Profile | null;
  studio: Studio | null;
  isLoading: boolean;
  refetchProfile: () => Promise<void>;
  simulateLogin: (isAdmin: boolean, studioId: string | null) => void; // NEW: Simulation function
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false); // NEW: Track if session is simulated

  const fetchProfileAndStudio = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setProfile(null);
      setStudio(null);
      setIsLoading(false);
      return;
    }
    
    // Skip fetching if it's a simulated session
    if (isSimulated) {
        setIsLoading(false);
        return;
    }

    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found (new user)
        throw profileError;
      }

      const currentProfile: Profile | null = profileData as Profile | null;
      setProfile(currentProfile);

      // 2. Fetch Studio if profile exists and has a studio_id
      if (currentProfile?.studio_id) {
        const { data: studioData, error: studioError } = await supabase
          .from('studios')
          .select('*')
          .eq('id', currentProfile.studio_id)
          .single();
        
        if (studioError && studioError.code !== 'PGRST116') {
            throw studioError;
        }
        setStudio(studioData as Studio || null);
      } else {
        setStudio(null);
      }

    } catch (error) {
      console.error("Error fetching profile or studio:", error);
      setProfile(null);
      setStudio(null);
    } finally {
      setIsLoading(false);
    }
  }, [isSimulated]);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      fetchProfileAndStudio(initialSession);
    });

    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsSimulated(false); // Reset simulation state on real auth change
      fetchProfileAndStudio(currentSession);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfileAndStudio]);
  
  const refetchProfile = useCallback(async () => {
      setIsLoading(true);
      await fetchProfileAndStudio(session);
  }, [session, fetchProfileAndStudio]);
  
  // NEW: Simulation function
  const simulateLogin = useCallback((isAdmin: boolean, studioId: string | null) => {
    setIsLoading(true);
    setIsSimulated(true);
    
    // Create a mock session object (required by ProtectedRoute)
    const mockSession: Session = {
        access_token: 'mock_token',
        token_type: 'Bearer',
        user: {
            id: 'simulated_user_id',
            aud: 'authenticated',
            role: 'authenticated',
            email: isAdmin ? 'admin@simulated.com' : 'user@simulated.com',
            email_confirmed_at: new Date().toISOString(),
            phone: '',
            created_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: {},
        },
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
    };
    
    // Create a mock profile
    const mockProfile: Profile = {
        id: 'simulated_user_id',
        first_name: isAdmin ? 'Simulated' : 'Studio',
        last_name: isAdmin ? 'Admin' : 'User',
        avatar_url: null,
        is_admin: isAdmin,
        studio_id: studioId,
    };
    
    setSession(mockSession);
    setProfile(mockProfile);
    
    // Fetch studio data if studioId is provided (we need real studio data for the UI)
    if (studioId) {
        supabase.from('studios').select('*').eq('id', studioId).single()
            .then(({ data, error }) => {
                if (error) console.error("Error fetching simulated studio:", error);
                setStudio(data as Studio || null);
            })
            .finally(() => setIsLoading(false));
    } else {
        setStudio(null);
        setIsLoading(false);
    }
    
  }, []);


  return (
    <SessionContext.Provider value={{ session, profile, studio, isLoading, refetchProfile, simulateLogin }}>
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