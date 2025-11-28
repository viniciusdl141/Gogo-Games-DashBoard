"use client";

import React, { useState, useMemo } from 'react';
import { WLSalesPlatformEntry, EventTrackingEntry, ManualEventMarker, Platform } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { cn, formatNumber } from '@/lib/utils';
import { Gamepad2, Plus, MessageSquare, DollarSign, Clock, ArrowRight, ArrowLeft, Image } from 'lucide-react'; // Importando Image
import WLSalesChartPanel from './WLSalesChartPanel';
import WLSalesTablePanel from './WLSalesTablePanel';
import ExportDataButton from './ExportDataButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AddDailyWLSalesForm from './AddDailyWLSalesForm';
import { toast } from 'sonner';

// Assets (usando paths relativos para os arquivos que você forneceu)
const PS_PLUS_LOGO = '/ps_plus.webp';
const PS_STARS_LOGO = '/ps_stars.png'; // Mantendo este como placeholder, se necessário

// Itens do menu horizontal da PlayStation
const PS_MENU_ITEMS = [
    { id: 'home', label: 'Home', icon: Gamepad2, asset: '/ps_home.webp' },
    { id: 'ps_plus', label: 'PS Plus', icon: Plus, asset: '/ps_plus.webp' },
    { id: 'add_ons', label: 'Add-Ons', icon: MessageSquare, asset: '/ps_addons.webp' },
    { id: 'free_to_play', label: 'Free to Play', icon: DollarSign, asset: '/ps_f2p.webp' },
    { id: 'vr', label: 'VR', icon: Clock, asset: '/ps_vr.webp' },
];

interface PlaystationDashboardContentProps {
    gameName: string;
    // Estes dados já vêm filtrados pelo Dashboard.tsx para a plataforma 'Playstation'
    wlSales: WLSalesPlatformEntry[]; 
    eventTracking: EventTrackingEntry[];
    manualEventMarkers: ManualEventMarker[];
    wlSalesDataForRecalculation: WLSalesPlatformEntry[];
    allGames: string[];
    onPointClick: (entry: WLSalesPlatformEntry) => void;
    onDeleteWLSalesEntry: (id: string) => void;
    onEditWLSalesEntry: (entry: WLSalesPlatformEntry) => void;
    onAddDailyWLSalesEntry: (newEntry: { date: string, platform: Platform, wishlists: number, sales: number }) => void;
}

const PS_CHART_COLORS = {
    daily: 'hsl(var(--ps-blue))',
    weekly: 'hsl(24 100% 60%)', // Orange for contrast
    monthly: 'hsl(220 10% 90%)', // Light gray for contrast
    event: 'hsl(24 100% 60%)', // Orange
    sales: 'hsl(220 80% 70%)', // Lighter PS Blue
};

const PlaystationDashboardContent: React.FC<PlaystationDashboardContentProps> = ({
    gameName,
    wlSales,
    eventTracking,
    manualEventMarkers,
    wlSalesDataForRecalculation,
    allGames,
    onPointClick,
    onDeleteWLSalesEntry,
    onEditWLSalesEntry,
    onAddDailyWLSalesEntry,
}) => {
    const [activeMenuItem, setActiveMenuItem] = useState(PS_MENU_ITEMS[0].id);
    const [isAddDailyWLSalesFormOpen, setIsAddDailyWLSalesFormOpen] = useState(false);
    const [isHistoryVisible, setIsHistoryVisible] = useState(true);
    
    // Use useMemo para simular a filtragem da seção da loja, mas mantendo a base de dados completa do PS
    const filteredWLSales = useMemo(() => {
        if (activeMenuItem === 'ps_plus') {
            // Simula PS Plus: Foca em Bundles/DLCs
            return wlSales.filter(e => e.saleType === 'Bundle' || e.saleType === 'DLC');
        }
        if (activeMenuItem === 'free_to_play') {
            // Simula F2P: Foca em entradas com 0 vendas (ou apenas WL)
            return wlSales.filter(e => e.sales === 0);
        }
        // Default: Retorna todos os dados do PlayStation
        return wlSales;
    }, [wlSales, activeMenuItem]);

    const activeAsset = PS_MENU_ITEMS.find(item => item.id === activeMenuItem)?.asset;

    return (
        <div className="space-y-6 p-4 theme-playstation ps-background-pattern min-h-[calc(100vh-100px)]">
            
            {/* --- PlayStation Horizontal Menu (Simulação) --- */}
            <div className="flex items-center space-x-6 p-4 bg-ps-dark/80 backdrop-blur-sm rounded-lg shadow-xl border border-ps-blue/50">
                <Gamepad2 className="h-8 w-auto text-ps-blue" />
                
                <div className="flex space-x-4 overflow-x-auto">
                    {PS_MENU_ITEMS.map(item => (
                        <Button
                            key={item.id}
                            variant="ghost"
                            onClick={() => setActiveMenuItem(item.id)}
                            className={cn(
                                "flex flex-col items-center justify-center h-20 w-20 p-1 rounded-lg transition-all duration-200",
                                "text-ps-light hover:bg-ps-blue/20",
                                activeMenuItem === item.id && "bg-ps-blue/30 border-b-4 border-ps-blue shadow-lg"
                            )}
                        >
                            <item.icon className="h-6 w-6 mb-1" />
                            <span className="text-xs font-semibold">{item.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* --- Conteúdo Principal (Gráfico e Ações) --- */}
            <Card className="ps-card-glow bg-card/90 border-ps-blue/50">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                    <CardTitle className="text-2xl font-bold text-ps-blue flex items-center">
                        <Gamepad2 className="h-6 w-6 mr-2" /> {gameName} - {PS_MENU_ITEMS.find(i => i.id === activeMenuItem)?.label}
                    </CardTitle>
                    
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsHistoryVisible(!isHistoryVisible)} 
                            className="text-ps-light border-ps-blue hover:bg-ps-blue/20"
                        >
                            {isHistoryVisible ? <ArrowLeft className="h-4 w-4 mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                            {isHistoryVisible ? 'Ocultar Tabela' : 'Mostrar Tabela'}
                        </Button>
                        <ExportDataButton 
                            data={filteredWLSales.filter(e => !e.isPlaceholder)}
                            filename={`${gameName}_Playstation_${activeMenuItem}_WL_Vendas.csv`} 
                            label="WL/Vendas"
                        />
                        <Dialog open={isAddDailyWLSalesFormOpen} onOpenChange={setIsAddDailyWLSalesFormOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsAddDailyWLSalesFormOpen(true)} className="bg-ps-blue hover:bg-ps-blue/90 text-white">
                                    <Plus className="h-4 w-4 mr-2" /> Adicionar Entrada Rápida
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[450px] bg-card text-card-foreground border-ps-blue">
                                <DialogHeader>
                                    <DialogTitle className="text-ps-blue">Adição Diária Rápida de Wishlist/Vendas</DialogTitle>
                                </DialogHeader>
                                <AddDailyWLSalesForm 
                                    gameName={gameName}
                                    // Passando apenas os dados do PS para o cálculo da WL anterior
                                    wlSalesData={wlSalesDataForRecalculation.filter(e => e.platform === 'Playstation')}
                                    onSave={(data) => onAddDailyWLSalesEntry({ ...data, platform: 'Playstation' })} 
                                    onClose={() => setIsAddDailyWLSalesFormOpen(false)} 
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                
                <CardContent className="p-4 space-y-6">
                    {/* Imagem de fundo simulando a tela principal */}
                    {activeAsset && (
                        <div className="relative h-48 w-full overflow-hidden rounded-lg mb-4">
                            <img 
                                src={activeAsset} 
                                alt={activeMenuItem} 
                                className="w-full h-full object-cover opacity-50" 
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                        parent.style.backgroundColor = 'hsl(var(--ps-dark))';
                                    }
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <p className="text-3xl font-bold text-white font-gamer drop-shadow-lg">
                                    {PS_MENU_ITEMS.find(i => i.id === activeMenuItem)?.label}
                                </p>
                            </div>
                        </div>
                    )}

                    <WLSalesChartPanel 
                        data={filteredWLSales} 
                        onPointClick={onPointClick} 
                        eventTracking={eventTracking}
                        manualEventMarkers={manualEventMarkers}
                        chartColors={PS_CHART_COLORS}
                        selectedPlatform={'Playstation'}
                    />
                    
                    {isHistoryVisible && (
                        <WLSalesTablePanel 
                            data={filteredWLSales.filter(e => !e.isPlaceholder)}
                            onDelete={onDeleteWLSalesEntry} 
                            onEdit={onEditWLSalesEntry}
                            games={allGames}
                            selectedPlatform={'Playstation'}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PlaystationDashboardContent;