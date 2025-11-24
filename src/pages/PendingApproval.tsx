import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Shield } from 'lucide-react';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PendingApproval = () => {
    const { profile, isLoading } = useSession();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.info("Você foi desconectado.");
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 gaming-background">
            <Card className="w-full max-w-md p-8 text-center shadow-gogo-orange-glow border border-border">
                <CardHeader className="flex flex-col items-center">
                    <Clock className="h-12 w-12 text-gogo-orange mb-4" />
                    <CardTitle className="text-2xl font-bold text-gogo-orange">Acesso Pendente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Sua conta ({profile?.first_name || 'Usuário'}) foi criada com sucesso, mas requer aprovação de um administrador antes de acessar o dashboard.
                    </p>
                    <p className="text-sm text-foreground font-medium">
                        Por favor, aguarde a aprovação.
                    </p>
                    <Button 
                        onClick={handleLogout} 
                        variant="destructive" 
                        className="w-full mt-4"
                    >
                        Sair
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default PendingApproval;