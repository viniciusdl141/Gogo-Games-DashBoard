"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

// Define types for Profile and Context
interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'studio' | 'user';
  studio_id: string | null;
}

interface SupabaseContextType {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  studioId: string | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      return;
    }
    
    setProfile(data as Profile);
  }, []);

  useEffect(() => {
    // Handle initial session and profile fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        toast.success('Login realizado com sucesso!');
        fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        toast.success('Logout realizado.');
        setProfile(null);
      } else if (event === 'USER_UPDATED' && session?.user) {
        fetchProfile(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const isAdmin = profile?.role === 'admin';
  const studioId = profile?.studio_id || null;

  const value = {
    supabase,
    session,
    user,
    profile,
    isLoading,
    isAdmin,
    studioId,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    // This is the error message you were seeing
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};