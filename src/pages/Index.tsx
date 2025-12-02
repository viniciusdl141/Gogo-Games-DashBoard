import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Zap, BarChart3, Gamepad2, Users, DollarSign } from 'lucide-react';
import SteamJsonAIProcessor from '@/components/SteamJsonAIProcessor';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

// --- Data Fetching Hooks ---

// Fetch total number of games
const useTotalGames = () => {
  return useQuery({
    queryKey: ['totalGames'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });
};

// Fetch total number of studios
const useTotalStudios = () => {
  return useQuery({
    queryKey: ['totalStudios'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('studios')
        .select('*', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });
};

// Fetch total number of profiles (users)
const useTotalUsers = () => {
  return useQuery({
    queryKey: ['totalUsers'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });
};

// Fetch total estimated revenue (sum of suggested_price * 1000 as a placeholder)
const useTotalEstimatedRevenue = () => {
  return useQuery({
    queryKey: ['totalEstimatedRevenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('suggested_price');
      
      if (error) throw new Error(error.message);

      const totalRevenue = data.reduce((sum, game) => sum + (game.suggested_price || 0) * 1000, 0);
      return totalRevenue;
    },
  });
};

// --- Dashboard Component ---

const Index = () => {
  const { data: totalGames, isLoading: loadingGames } = useTotalGames();
  const { data: totalStudios, isLoading: loadingStudios } = useTotalStudios();
  const { data: totalUsers, isLoading: loadingUsers } = useTotalUsers();
  const { data: totalRevenue, isLoading: loadingRevenue } = useTotalEstimatedRevenue();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const MetricCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; loading: boolean }> = ({ title, value, icon, loading }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          ) : (
            value
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Visão geral do sistema
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard de Análise</h1>
        
        {/* NEW BUTTON FOR AI PROCESSOR */}
        <Sheet>
          <SheetTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Zap className="w-4 h-4 mr-2" />
              Processar JSON Steam com IA
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Análise de Dados Steam</SheetTitle>
            </SheetHeader>
            <SteamJsonAIProcessor />
          </SheetContent>
        </Sheet>
        {/* END NEW BUTTON */}
      </header>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total de Jogos" 
          value={totalGames} 
          icon={<Gamepad2 className="h-4 w-4 text-muted-foreground" />} 
          loading={loadingGames}
        />
        <MetricCard 
          title="Estúdios Registrados" 
          value={totalStudios} 
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />} 
          loading={loadingStudios}
        />
        <MetricCard 
          title="Usuários Ativos" 
          value={totalUsers} 
          icon={<Users className="h-4 w-4 text-muted-foreground" />} 
          loading={loadingUsers}
        />
        <MetricCard 
          title="Receita Estimada (Placeholder)" 
          value={formatCurrency(totalRevenue || 0)} 
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} 
          loading={loadingRevenue}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gráfico de performance de vendas e wishlist (Placeholder para futuro gráfico).
              </p>
              <div className="h-64 bg-gray-50 border rounded mt-4 flex items-center justify-center text-gray-400">
                Área de Gráfico
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/games">
                <Button variant="outline" className="w-full justify-start">Gerenciar Jogos</Button>
              </Link>
              <Link to="/studios">
                <Button variant="outline" className="w-full justify-start">Gerenciar Estúdios</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;