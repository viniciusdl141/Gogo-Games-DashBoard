"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Gamepad, Settings, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StudioList from '@/components/admin/StudioList';
import GameAssignment from '@/components/admin/GameAssignment';
import CreateDefaultStudio from '@/components/admin/CreateDefaultStudio';
import { ThemeToggle } from '@/components/ThemeToggle';

const AdminDashboard: React.FC = () => {
    const { profile, isLoading, user } = useSession();
    const [activeTab, setActiveTab] = useState('studios'); // Adicionando estado para a aba ativa

    // Se estiver carregando a sessão/perfil, mostre o loader.
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gogo-cyan" />
            </div>
        );
    }

    // DEBUG: Exibe informações do perfil no console (apenas para desenvolvimento)
    console.log("DEBUG - AdminDashboard", {
        profile: profile,
        user: user,
        isLoading: isLoading,
        hasSession: !!user,
    });

    // Redirecionar se não for admin (inclui o caso onde profile é null após o carregamento)
    if (profile?.role !== 'admin') {
        const message = profile?.role === 'user' 
            ? "Acesso negado. Apenas administradores podem acessar esta página."
            : "Acesso negado. Perfil não encontrado ou role inválida.";
        toast.error(message);
        
        // DEBUG: Exibe mensagem de erro detalhada no console
        console.warn("DEBUG - Acesso negado:", {
            profile: profile,
            user: user,
            reason: profile?.role !== 'admin' ? 'role !== admin' : 'profile null'
        });
        
        return <Navigate to="/" replace />;
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.info("Sessão encerrada.");
    };

    return (
        <div className="min-h-screen p-4 md:p-8 font-sans gaming-background">
            {/* Componente que cria o estúdio padrão automaticamente */}
            <CreateDefaultStudio />

            <header className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-extrabold text-gogo-orange drop-shadow-md flex items-center">
                        <Settings className="h-6 w-6 mr-2" /> Painel de Administração
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Gerenciamento de Estúdios e Atribuição de Jogos</p>
                </div>
                <div className="flex items-center space-x-4">
                    <ThemeToggle />
                    <Button onClick={handleLogout} variant="outline" size="sm">
                        <LogOut className="h-4 w-4 mr-2" /> Sair
                    </Button>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px] mx-auto">
                    <TabsTrigger value="studios" className="flex items-center">
                        <Users className="h-4 w-4 mr-2" /> Estúdios & Usuários
                    </TabsTrigger>
                    <TabsTrigger value="assignment" className="flex items-center">
                        <Gamepad className="h-4 w-4 mr-2" /> Atribuição de Jogos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="studios" className="mt-6">
                    <StudioList />
                </TabsContent>

                <TabsContent value="assignment" className="mt-6">
                    <GameAssignment />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminDashboard;