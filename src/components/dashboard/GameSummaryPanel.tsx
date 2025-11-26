"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, List, TrendingUp, Info, Eye, Megaphone, CalendarDays, Tag, Presentation, Image, Loader2 } from 'lucide-react';
import KpiCard from './KpiCard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import LaunchTimer from './LaunchTimer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EditGameGeneralInfoForm from './EditGameGeneralInfoForm'; // Importar o novo nome
import GameCapsule from './GameCapsule'; 
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { fetchAndSetGameMetadata, Game as SupabaseGame } from '@/integrations/supabase/games'; // Importar a nova função
import { toast } from 'sonner';

interface GameSummaryPanelProps {
    gameId: string; // Adicionado gameId
    gameName: string;
    totalSales: number;
    totalWishlists: number;
    totalInvestment: number;
    totalInfluencerViews: number; // KPI separado
    totalEventViews: number; // KPI separado
    totalImpressions: number; // KPI separado
    launchDate: Date | null;
    suggestedPrice: number; // Novo prop
    capsuleImageUrl: string | null; // NOVO PROP
    category: string | null; // NOVO PROP
    investmentSources: { influencers: number, events: number, paidTraffic: number };
    onUpdateLaunchDate: (gameId: string, launchDate: string | null, capsuleImageUrl: string | null, category: string | null) => void; // Assinatura atualizada
    onMetadataUpdate: () => void; // Novo prop para forçar o refetch de games no Dashboard
}

const GameSummaryPanel: React.FC<GameSummaryPanelProps> = ({ 
    gameId,
    gameName, 
    totalSales, 
    totalWishlists, 
    totalInvestment,
    totalInfluencerViews,
    totalEventViews,
    totalImpressions,
    launchDate,
    suggestedPrice, 
    capsuleImageUrl, // Receber capsuleImageUrl
    category, // Receber category
    investmentSources,
    onUpdateLaunchDate,
    onMetadataUpdate,
}) => {
    const navigate = useNavigate();
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
    
    // Usar suggestedPrice como valor inicial, mas permitir edição local
    const [gamePrice, setGamePrice] = React.useState(suggestedPrice);
    React.useEffect(() => {
        setGamePrice(suggestedPrice);
    }, [suggestedPrice]);

    const [revenueShare, setRevenueShare] = React.useState(0.70);
    const [salesBRL, setSalesBRL] = React.useState(0);
    const [salesUSD, setSalesUSD] = React.useState(0);
    const [isLaunchDateDialogOpen, setIsLaunchDateDialogOpen] = useState(false);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setGamePrice(isNaN(value) ? 0 : value);
    };

    const handleShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setRevenueShare(isNaN(value) ? 0 : value / 100);
    };

    const handlePresentationMode = () => {
        navigate(`/presentation/${gameId}`);
    };
    
    const handleFetchMetadata = async () => {
        if (gameId.startsWith('game-')) {
            toast.error("Este jogo não está salvo no Supabase. Adicione-o primeiro.");
            return;
        }
        
        setIsFetchingMetadata(true);
        toast.loading(`Buscando metadados para "${gameName}"...`, { id: 'fetch-meta' });

        try {
            // Create a mock SupabaseGame object for the fetcher function
            const gameToFetch: SupabaseGame = {
                id: gameId,
                name: gameName,
                launch_date: launchDate ? launchDate.toISOString().split('T')[0] : null,
                suggested_price: suggestedPrice,
                capsule_image_url: capsuleImageUrl,
                category: category,
                created_at: new Date().toISOString(),
                studio_id: null,
            };
            
            const updatedGame = await fetchAndSetGameMetadata(gameToFetch);

            toast.dismiss('fetch-meta');
            if (updatedGame) {
                toast.success(`Metadados e imagem da cápsula atualizados para "${gameName}".`);
                onMetadataUpdate(); // Trigger refetch in Dashboard parent
            } else {
                toast.info(`Nenhuma nova informação encontrada para "${gameName}".`);
            }
        } catch (error) {
            console.error("Error fetching metadata:", error);
            toast.dismiss('fetch-meta');
            toast.error(`Falha ao buscar metadados: ${error.message}`);
        } finally {
            setIsFetchingMetadata(false);
        }
    };


    // --- Cálculos de Receita ---
    
    // 1. Cálculos baseados em totalSales (dados de tracking)
    const grossRevenue = totalSales * gamePrice;
    const netRevenue = grossRevenue * revenueShare;
    const netProfit = netRevenue - totalInvestment;
    // const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0; // Não usado na UI, removido para simplificar

    // 2. Cálculos baseados em inputs manuais (Calculadora)
    const totalManualSales = salesBRL + salesUSD;
    const grossManualRevenue = totalManualSales * gamePrice;
    const netManualRevenue = grossManualRevenue * revenueShare; // netManualRevenue é calculado aqui
    const netManualProfit = netManualRevenue - totalInvestment;
    const roiManualPercentage = totalInvestment > 0 ? (netManualProfit / totalInvestment) * 100 : 0;


    return (
        <Card>
            <CardHeader>
                <div className="flex items-start space-x-4">
                    <GameCapsule 
                        imageUrl={capsuleImageUrl} 
                        gameName={gameName} 
                        className="w-32 h-12 flex-shrink-0" 
                    />
                    <div>
                        <CardTitle className="text-2xl">Resumo Geral do Jogo: {gameName}</CardTitle>
                        {category && (
                            <Badge variant="secondary" className="mt-2 text-sm flex items-center w-fit">
                                <Tag className="h-3 w-3 mr-1" /> {category}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Contador de Lançamento e Botão de Edição */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                    {launchDate && <LaunchTimer launchDate={launchDate} />}
                    
                    <Button 
                        onClick={handlePresentationMode} 
                        variant="default" 
                        size="sm" 
                        className="bg-gogo-cyan hover:bg-gogo-cyan/90 text-white"
                    >
                        <Presentation className="h-4 w-4 mr-2" /> Modo Apresentação
                    </Button>

                    <Dialog open={isLaunchDateDialogOpen} onOpenChange={setIsLaunchDateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-gogo-orange hover:bg-gogo-orange/90 text-white"
                                onClick={() => setIsLaunchDateDialogOpen(true)}
                            >
                                <CalendarDays className="h-4 w-4 mr-2" /> Editar Informações Gerais
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Editar Informações Gerais</DialogTitle>
                            </DialogHeader>
                            <EditGameGeneralInfoForm 
                                gameId={gameId}
                                gameName={gameName}
                                currentLaunchDate={launchDate}
                                currentCapsuleImageUrl={capsuleImageUrl}
                                currentCategory={category} // Passando a categoria atual
                                onSave={onUpdateLaunchDate}
                                onClose={() => setIsLaunchDateDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                    
                    {/* Botão de Busca de Imagem/Metadados */}
                    <Button 
                        onClick={handleFetchMetadata} 
                        variant="outline" 
                        size="sm" 
                        disabled={isFetchingMetadata || gameId.startsWith('game-')}
                        className="text-gogo-cyan border-gogo-cyan hover:bg-gogo-cyan/10"
                    >
                        {isFetchingMetadata ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Image className="h-4 w-4 mr-2" />
                        )}
                        Buscar Imagem/Metadados
                    </Button>
                </div>

                {/* KPIs de Vendas e WL */}
                <div className="grid gap-4 md:grid-cols-3">
                    <KpiCard 
                        title="Vendas Totais (Registradas)" 
                        value={formatNumber(totalSales)} 
                        icon={<TrendingUp className="h-4 w-4 text-gogo-orange" />} 
                    />
                    <KpiCard 
                        title="Wishlists Totais (Último Reg.)" 
                        value={formatNumber(totalWishlists)} 
                        icon={<List className="h-4 w-4 text-gogo-cyan" />} 
                    />
                    <KpiCard 
                        title="Investimento Total (R$)" 
                        value={formatCurrency(totalInvestment)} 
                        icon={
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Influencers: {formatCurrency(investmentSources.influencers)}</p>
                                    <p>Eventos: {formatCurrency(investmentSources.events)}</p>
                                    <p>Tráfego Pago: {formatCurrency(investmentSources.paidTraffic)}</p>
                                </TooltipContent>
                            </Tooltip>
                        } 
                    />
                </div>

                {/* Novos KPIs de Visualizações e Impressões Separadas */}
                <div className="grid gap-4 md:grid-cols-3">
                    <KpiCard 
                        title="Visualizações (Influencers)" 
                        value={formatNumber(totalInfluencerViews)} 
                        icon={<Eye className="h-4 w-4 text-gogo-cyan" />} 
                        description="De campanhas de influencers."
                    />
                    <KpiCard 
                        title="Visualizações (Eventos)" 
                        value={formatNumber(totalEventViews)} 
                        icon={<Megaphone className="h-4 w-4 text-gogo-orange" />} 
                        description="De participações em eventos."
                    />
                    <KpiCard 
                        title="Impressões (Tráfego Pago)" 
                        value={formatNumber(totalImpressions)} 
                        icon={<Megaphone className="h-4 w-4 text-gogo-cyan" />} 
                        description="De campanhas de tráfego pago."
                    />
                </div>

                <Separator />

                {/* Calculadora Financeira (Oculta por padrão) */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="calculator" className="border-b">
                        <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                            Calculadora de Receita (Ferramenta Auxiliar)
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="game-price">Preço do Jogo (R$)</Label>
                                    <Input 
                                        id="game-price"
                                        type="number" 
                                        step="0.01" 
                                        value={gamePrice} 
                                        onChange={handlePriceChange} 
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="revenue-share">Repasse de Receita (%)</Label>
                                    <Input 
                                        id="revenue-share"
                                        type="number" 
                                        step="1" 
                                        value={Math.round(revenueShare * 100)} 
                                        onChange={handleShareChange} 
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sales-brl">Unidades Vendidas (R$)</Label>
                                    <Input 
                                        id="sales-brl"
                                        type="number" 
                                        step="1" 
                                        value={salesBRL} 
                                        onChange={e => setSalesBRL(parseFloat(e.target.value) || 0)} 
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sales-usd">Unidades Vendidas (USD)</Label>
                                    <Input 
                                        id="sales-usd"
                                        type="number" 
                                        step="1" 
                                        value={salesUSD} 
                                        onChange={e => setSalesUSD(parseFloat(e.target.value) || 0)} 
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4 pt-4">
                                <KpiCard 
                                    title="Receita Bruta (Calc.)" 
                                    value={formatCurrency(grossManualRevenue)} 
                                />
                                <KpiCard 
                                    title="Receita Líquida (Calc.)" 
                                    value={formatCurrency(netManualRevenue)} 
                                />
                                <KpiCard 
                                    title="Lucro Líquido (Calc.)" 
                                    value={formatCurrency(netManualProfit)} 
                                    description={netManualProfit >= 0 ? "Parabéns!" : "Revisar custos."}
                                />
                                <KpiCard 
                                    title="ROI (%) (Calc.)" 
                                    value={`${roiManualPercentage.toFixed(2)}%`} 
                                    description={totalInvestment === 0 ? "Sem investimento para calcular ROI" : undefined}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
};

export default GameSummaryPanel;