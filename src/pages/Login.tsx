"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Login = () => {
  const navigate = useNavigate();
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);

  useEffect(() => {
    // Check if supabase client is initialized
    if (supabase) {
      setIsSupabaseReady(true);
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          navigate('/');
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      console.error("Supabase client is not initialized in Login component.");
      // Optionally, you could show an error message to the user here
    }
  }, [navigate]);

  if (!isSupabaseReady) {
    return <div className="min-h-screen flex items-center justify-center">Carregando autenticação...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gaming-background">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-gogo-orange-glow border border-border transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Entrar no Dashboard</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--gogo-cyan))',
                  brandAccent: 'hsl(var(--gogo-orange))',
                  defaultButtonBackground: 'hsl(var(--primary))',
                  defaultButtonBackgroundHover: 'hsl(var(--primary-foreground))',
                  defaultButtonBorder: 'hsl(var(--border))',
                  defaultButtonText: 'hsl(var(--primary-foreground))',
                  inputBackground: 'hsl(var(--input))',
                  inputBorder: 'hsl(var(--border))',
                  inputText: 'hsl(var(--foreground))',
                  inputLabelText: 'hsl(var(--muted-foreground))',
                },
              },
              dark: {
                colors: {
                  brand: 'hsl(var(--gogo-cyan))',
                  brandAccent: 'hsl(var(--gogo-orange))',
                  defaultButtonBackground: 'hsl(var(--primary))',
                  defaultButtonBackgroundHover: 'hsl(var(--primary-foreground))',
                  defaultButtonBorder: 'hsl(var(--border))',
                  defaultButtonText: 'hsl(var(--primary-foreground))',
                  inputBackground: 'hsl(var(--input))',
                  inputBorder: 'hsl(var(--border))',
                  inputText: 'hsl(var(--foreground))',
                  inputLabelText: 'hsl(var(--muted-foreground))',
                },
              },
            },
          }}
          // Removido theme="dark" para permitir que o ThemeProvider global gerencie
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
};

export default Login;