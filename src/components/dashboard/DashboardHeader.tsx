"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';

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

    return (
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div className="flex flex-col">
                <h1 className="text-4xl font-extrabold text-gogo-cyan drop-shadow-md font-gamer">
                    Gogo Games Dashboard
                </h1>
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