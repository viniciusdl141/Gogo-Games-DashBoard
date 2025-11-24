"use client";

import React from 'react';
import StudioManagement from '@/components/admin/StudioManagement';
import { useSession } from '@/components/SessionContextProvider';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const StudioManager: React.FC = () => {
    const { profile, isLoading } = useSession();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    // Only allow access if user is admin
    if (!profile?.is_admin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen p-4 md:p-8 font-sans gaming-background">
            <Card className="container mx-auto p-6 shadow-xl border border-border bg-card">
                <h1 className="text-3xl font-bold mb-6 text-gogo-cyan">Gerenciamento de Estúdios</h1>
                <StudioManagement />
            </Card>
        </div>
    );
};

export default StudioManager;