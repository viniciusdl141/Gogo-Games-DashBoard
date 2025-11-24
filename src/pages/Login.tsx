"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getStudios } from '@/integrations/supabase/studios';
import { Loader2, User, Shield } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { simulateLogin, session, profile } = useSession();
  const [isSimulating, setIsSimulating] = useState(false);

  // Fetch studios to determine the default studio for simulation
  const { data: studios, isLoading: isLoadingStudios } = useQuery({
    queryKey: ['studios'],
    queryFn: getStudios,
    initialData: [],
  });

  // Find the Admin's studio ID (GoGo Games Interactive) and a non-admin studio ID
  const adminStudio = studios.find(s => s.name === 'GoGo Games Interactive');
  const nonAdminStudio = studios.find(s => s.name !== 'GoGo Games Interactive');

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
  
  useEffect(() => {
      if (session && profile) {
          navigate('/');
      }
  }, [session, profile, navigate]);

  const handleSimulateLogin = (isAdmin: boolean) => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    
    let studioId: string | null = null;
    
    if (isAdmin) {
        studioId = adminStudio?.id || null;
    } else {
        studioId = nonAdminStudio?.id || null;
        if (!studioId) {
            toast.error("Nenhum estúdio não-admin encontrado para simulação.");
            setIsSimulating(false);
            return;
        }
    }
    
    simulateLogin(isAdmin, studioId);
    toast.success(`Login simulado como ${isAdmin ? 'Admin' : 'Usuário de Estúdio'}.`);
    // Navigation handled by useEffect after context update
  };

  if (isLoadingStudios) {
      return <div className="min-h-screen flex items-center justify-center">Carregando estúdios...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gaming-background">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-gogo-orange-glow border border-border transition-shadow duration-300 space-y-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Entrar no Dashboard</h2>
        
        {/* Botões de Simulação */}
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">Modo de Teste RLS:</p>
            <Button 
                onClick={() => handleSimulateLogin(true)} 
                disabled={isSimulating || !adminStudio}
                className="w-full bg-gogo-orange hover:bg-gogo-orange/90 text-white"
            >
                {isSimulating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                Simular Login como Admin ({adminStudio?.name || 'N/A'})
            </Button>
            <Button 
                onClick={() => handleSimulateLogin(false)} 
                disabled={isSimulating || !nonAdminStudio}
                variant="secondary"
                className="w-full"
            >
                {isSimulating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <User className="h-4 w-4 mr-2" />}
                Simular Login como Usuário ({nonAdminStudio?.name || 'N/A'})
            </Button>
        </div>
        
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Ou Login Real</span>
        </div>

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