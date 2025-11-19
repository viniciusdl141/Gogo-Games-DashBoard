"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gaming-background">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-xl border border-border">
        <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Entrar no Dashboard</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Removendo provedores de terceiros para simplificar
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--gogo-cyan))',
                  brandAccent: 'hsl(var(--gogo-orange))',
                  // Ajustar cores para o tema claro/escuro
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
          theme="dark" // Definir tema inicial como dark para melhor contraste com o fundo claro do Auth UI
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
};

export default Login;