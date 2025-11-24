"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Shield } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { session, profile, refetchProfile } = useSession(); // Adicionado refetchProfile

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Força o recarregamento do perfil para pegar is_approved/is_admin atualizados
        refetchProfile(); 
      }
      if (session) {
        // A navegação final será tratada pelo useEffect abaixo, após o perfil ser carregado
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refetchProfile]);
  
  useEffect(() => {
      if (session && profile) {
          // Se o perfil estiver carregado e aprovado, navega para o dashboard
          if (profile.is_approved) {
              navigate('/');
          } else {
              // Se o perfil estiver carregado mas não aprovado, navega para a tela de pendência
              navigate('/pending-approval');
          }
      }
  }, [session, profile, navigate]);


  return (
    <div className="min-h-screen flex items-center justify-center p-4 gaming-background">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-gogo-orange-glow border border-border transition-shadow duration-300 space-y-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-foreground flex items-center justify-center">
            <Shield className="h-6 w-6 mr-2 text-gogo-orange" />
            Acesso ao Dashboard
        </h2>
        
        {/* Auth UI Real */}
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
          theme="dark"
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
};

export default Login;