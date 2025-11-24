"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Shield, Loader2 } from 'lucide-react'; // Importando Loader2

const Login = () => {
  const navigate = useNavigate();
  const { session, profile, isLoading, refetchProfile } = useSession(); // Incluindo isLoading

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Força o recarregamento do perfil para pegar is_approved/is_admin atualizados
        refetchProfile(); 
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refetchProfile]);
  
  useEffect(() => {
      // Se estiver carregando, não faça nada.
      if (isLoading) return; 
      
      if (session && profile) {
          // Se o perfil estiver carregado e aprovado, navega para o dashboard
          if (profile.is_approved) {
              navigate('/');
          } else {
              // Se o perfil estiver carregado mas não aprovado, navega para a tela de pendência
              navigate('/pending-approval');
          }
      }
      // Se houver sessão mas o perfil for null (e não estiver carregando), algo deu errado, mas não redirecionamos para evitar loop.
      // Se não houver sessão, permanecemos na tela de login.
  }, [session, profile, isLoading, navigate]);


  return (
    <div className="min-h-screen flex items-center justify-center p-4 gaming-background">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-gogo-orange-glow border border-border transition-shadow duration-300 space-y-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-foreground flex items-center justify-center">
            <Shield className="h-6 w-6 mr-2 text-gogo-orange" />
            Acesso ao Dashboard
        </h2>
        
        {/* Se estiver carregando, mostre um indicador, senão mostre o Auth UI */}
        {isLoading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-gogo-cyan" />
            </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default Login;