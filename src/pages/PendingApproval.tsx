"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Clock, LogOut } from 'lucide-react';

const PendingApproval: React.FC = () => {
    const { profile, user } = useSession();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 gaming-background">
            <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-gogo-orange-glow border border-border text-center space-y-6">
                <Clock className="h-12 w-12 mx-auto text-gogo-orange" />
                <h1 className="text-2xl font-bold text-foreground">Acesso Pendente de Aprovação</h1>
                
                <p className="text-muted-foreground">
                    Sua conta foi criada, mas o acesso ao dashboard requer aprovação de um administrador.
                </p>
                
                {user?.email && (
                    <p className="text-sm text-muted-foreground">
                        Email registrado: <span className="font-medium text-foreground">{user.email}</span>
                    </p>
                )}

                <p className="text-sm text-gogo-cyan font-medium">
                    Por favor, aguarde a aprovação. Você pode tentar fazer login novamente mais tarde.
                </p>

                <Button onClick={handleLogout} variant="outline" className="w-full mt-4">
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                </Button>
            </div>
        </div>
    );
};

export default PendingApproval;