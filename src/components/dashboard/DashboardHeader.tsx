"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom'; // Importando Link
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; // Import cn

const DashboardHeader: React.FC = () => {
    const { user, profile, isAdmin, isLoading } = useSession();
    const navigate = useNavigate();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Falha ao fazer logout.");
            console.error(error);
        } else {
            toast.success("Logout realizado com sucesso.");
            navigate('/login');
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-end space-x-4">Carregando usuário...</div>;
    }

    const userRole = profile?.role || 'Convidado';
    const studioId = profile?.studio_id;
    
    // Determine if the PlayStation theme is active based on the platform filter in Dashboard (not directly available here, but we can assume the parent context handles the theme wrapper)
    // We apply a general semi-transparent dark background to ensure readability over any theme background.
    const headerClasses = cn(
        "flex items-center justify-between mb-8 pb-4 border-b border-border",
        "bg-card/80 backdrop-blur-sm p-4 -mx-4 -mt-4 rounded-t-lg shadow-md" // Adiciona fundo semi-transparente
    );

    return (
        <header className={headerClasses}>
            <div className="flex flex-col">
                {/* O Link deve envolver o H1 para ser clicável */}
                <Link to="/" className="hover:opacity-80 transition-opacity cursor-pointer"> 
                    <h1 className="text-3xl font-gamer text-gogo-cyan">
                        GoGo Games <span className="text-gogo-orange">Dashboard</span>
                    </h1>
                </Link>
                <p className="text-lg text-muted-foreground mt-2">
                    {isAdmin ? 'Modo: Administrador' : `Modo: Estúdio (${userRole})`}
                </p>
            </div>
            <div className="flex items-center space-x-4">
                {isAdmin && (
                    <Button 
                        onClick={() => navigate('/admin')} 
                        variant="default" 
                        className="bg-gogo-orange hover:bg-gogo-orange/90 text-white"
                    >
                        <Settings className="h-4 w-4 mr-2" /> Painel Admin
                    </Button>
                )}
                
                <ThemeToggle />
                
                {user && (
                    <Button onClick={handleLogout} variant="outline" size="icon">
                        <LogOut className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </header>
    );
};

export default DashboardHeader;