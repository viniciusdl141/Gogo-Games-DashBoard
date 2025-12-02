"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { DollarSign, List, TrendingUp, Image, Edit } from 'lucide-react'; // Removed Clock, Bot, Search, Loader2
import { formatCurrency, formatNumber, cn } from '@/lib/utils'; 
import LaunchTimer from './LaunchTimer';
import KpiCard from './KpiCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditGameGeneralInfoForm from './EditGameGeneralInfoForm';
// import { Game as SupabaseGame } from '@/integrations/supabase/schema'; // Removed
// import { toast } from 'sonner'; // Removed

// Placeholder function (assuming it should exist in games.ts or be implemented here)
// Since it's not exported from games.ts, I'll define a stub here to resolve the import error.
const fetchAndSetGameMetadata = async (gameName: string, _form: any) => { // Used _form to mark as unused
    console.warn(`fetchAndSetGameMetadata called for ${gameName}. Implementation needed.`);
    // Simulate fetching data
    await new Promise(resolve => setTimeout(resolve, 500));
};

interface GameSummaryPanelProps {
    gameId: string;
    gameName: string;
    totalSales: number;
    totalWishlists: number;
    totalInvestment: number;
    totalInfluencerViews: number;
    totalEventViews: number;
    totalImpressions: number;
    launchDate: Date | null;
    suggestedPrice: number | null;
    capsuleImageUrl: string | null;
    category: string | null;
    investmentSources: { influencers: number, events: number, paidTraffic: number };
    onUpdateLaunchDate: (gameId: string, launchDate: string | null, capsuleImageUrl: string | null, category: string | null) => void;
    onMetadataUpdate: () => void;
}

const GameSummaryPanel: React.FC<GameSummaryPanelProps> = ({
    gameId,
    gameName,
    totalSales,
    totalWishlists,
    totalInvestment,
    totalInfluencerViews: _totalInfluencerViews, // Marked as unused
    totalEventViews: _totalEventViews, // Marked as unused
    totalImpressions: _totalImpressions, // Marked as unused
    launchDate,
    suggestedPrice,
    capsuleImageUrl,
    category,
    investmentSources: _investmentSources, // Marked as unused
    onUpdateLaunchDate,
    onMetadataUpdate,
}) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Cálculos de Receita e ROI (Estimativas)
    const price = suggestedPrice || 19.99;
    const grossRevenue = totalSales * price;
    const netRevenue = grossRevenue * 0.7; // Estimativa: 30% de taxa de plataforma/impostos
    const netProfit = netRevenue - totalInvestment;
    const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    // Helper para formatar ROI
    const formatRoi = (roi: number) => {
        const formatted = roi.toFixed(1);
        return `${formatted}%`;
    };

    return (
        <Card className="ps-card-glow bg-card/50 backdrop-blur-sm border-ps-blue/50">
            <CardHeader className="flex flex-row items-start justify-between p-4">
                <div className="flex items-center space-x-4">
                    {capsuleImageUrl ? (
                        <img src={capsuleImageUrl} alt={gameName} className="w-16 h-16 object-cover rounded-lg shadow-md" />
                    ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                    )}
                    <div>
                        <CardTitle className="text-2xl font-bold text-ps-blue">{gameName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{category || 'Categoria não definida'}</p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-ps-light border-ps-blue hover:bg-ps-blue/20">
                                <Edit className="h-4 w-4 mr-2" /> Editar Metadados
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-ps-blue">
                            <DialogHeader>
                                <DialogTitle className="text-ps-blue">Editar Informações Gerais do Jogo</DialogTitle>
                            </DialogHeader>
                            <EditGameGeneralInfoForm 
                                gameId={gameId}
                                gameName={gameName}
                                currentLaunchDate={launchDate}
                                currentCapsuleImageUrl={capsuleImageUrl}
                                currentCategory={category}
                                onUpdateLaunchDate={onUpdateLaunchDate}
                                onMetadataUpdate={onMetadataUpdate}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            
            <CardContent className="p-4 space-y-6">
                <LaunchTimer launchDate={launchDate} />

                <div className="grid gap-4 md:grid-cols-3">
                    <KpiCard 
                        title="Vendas Totais (Registradas)"
                        value={formatNumber(totalSales)}
                        description="Unidades vendidas em todas as plataformas"
                        icon={<List className="h-4 w-4 text-gogo-cyan" />}
                    />
                    <KpiCard 
                        title="Wishlists Totais (Último Reg.)"
                        value={formatNumber(totalWishlists)}
                        description="Último registro de WL total"
                        icon={<TrendingUp className="h-4 w-4 text-gogo-orange" />}
                    />
                    <KpiCard 
                        title="Investimento Total (R$)"
                        value={formatCurrency(totalInvestment)}
                        description={`Marketing: ${formatCurrency(totalInvestment)}`}
                        icon={<DollarSign className="h-4 w-4 text-red-500" />}
                    />
                </div>

                <div className="border-t border-border pt-4">
                    <h3 className="text-lg font-semibold mb-3 text-ps-light">Estimativas Financeiras (Base: {formatCurrency(price)})</h3>
                    <div className="grid gap-4 md:grid-cols-4 pt-4">
                        <KpiCard 
                            title="Receita Bruta (Calc.)"
                            value={formatCurrency(grossRevenue)}
                            description={`Total Sales * ${formatCurrency(price)}`}
                            icon={<DollarSign className="h-4 w-4 text-green-500" />}
                        />
                        <KpiCard 
                            title="Receita Líquida (Calc.)"
                            value={formatCurrency(netRevenue)}
                            description="Estimativa (70% da Receita Bruta)"
                            icon={<DollarSign className="h-4 w-4 text-green-600" />}
                        />
                        <KpiCard 
                            title="Lucro Líquido (Calc.)"
                            value={formatCurrency(netProfit)}
                            description="Receita Líquida - Investimento Total"
                            icon={<DollarSign className="h-4 w-4 text-green-700" />}
                        />
                        <KpiCard 
                            title="ROI (%) (Calc.)"
                            value={formatRoi(roiPercentage)}
                            description="Lucro Líquido / Investimento Total"
                            icon={<TrendingUp className="h-4 w-4 text-gogo-cyan" />}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GameSummaryPanel;