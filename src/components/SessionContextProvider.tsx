"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  role: 'admin' | 'studio' | 'user';
  studio_id: string | null;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  studioId: string | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const ADMIN_EMAIL = 'viniciusgamejamplus@gmail.com';

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    const isAdminUser = currentUser.email === ADMIN_EMAIL;
    
    if (isAdminUser) {
        // Admin bypasses profile fetch for speed and guarantees admin role
        setProfile({ role: 'admin', studio_id: null });
        return { role: 'admin', studio_id: null };
    }

    // Fetch profile for non-admin users
    const { data, error } = await supabase
      .from('profiles')
      .select('role, studio_id')
      .eq('id', currentUser.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      return null;
    }

    const userProfile: UserProfile = {
        role: data.role as 'admin' | 'studio' | 'user',
        studio_id: data.studio_id,
    };
    setProfile(userProfile);
    return userProfile;
  };

  useEffect(() => {
    const handleSession = async (currentSession: Session | null) => {
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        const userProfile = await fetchProfile(currentSession.user);
        
        // If the user is the admin but the profile fetch failed (shouldn't happen if admin logic is correct), 
        // we still rely on the email check for isAdmin status.
        const isAdminStatus = currentSession.user.email === ADMIN_EMAIL;
        
        if (isAdminStatus && (!userProfile || userProfile.role !== 'admin')) {
            // Force update profile table if admin profile is missing or incorrect
            await supabase.from('profiles').upsert({ 
                id: currentSession.user.id, 
                email: currentSession.user.email, 
                role: 'admin', 
                studio_id: null 
            });
            setProfile({ role: 'admin', studio_id: null });
        }

      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
        handleSession(session);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = profile?.role === 'admin';
  const studioId = profile?.studio_id || null;

  return (
    <SessionContext.Provider value={{ session, user, profile, isAdmin, studioId, isLoading }}>
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