"use client";

import React, { useState, useMemo } from 'react';
import { WLSalesPlatformEntry, EventTrackingEntry, ManualEventMarker, Platform } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { cn, formatNumber } from '@/lib/utils';
import { Plus, EyeOff, Eye, CalendarPlus, Palette, History, ArrowRight, ArrowLeft, Gamepad2 } from 'lucide-react';
import WLSalesChartPanel from './WLSalesChartPanel';
import WLSalesTablePanel from './WLSalesTablePanel';
import ExportDataButton from './ExportDataButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AddDailyWLSalesForm from './AddDailyWLSalesForm';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Cores do gráfico ajustadas para o tema PlayStation
const PS_CHART_COLORS = {
    daily: 'hsl(var(--ps-blue))',
    weekly: 'hsl(24 100% 60%)', // Orange for contrast
    monthly: 'hsl(220 10% 90%)', // Light gray for contrast
    event: 'hsl(24 100% 60%)', // Orange
    sales: 'hsl(220 80% 70%)', // Lighter PS Blue
};

interface WLSalesPanelThemedProps {
    gameName: string;
    wlSales: WLSalesPlatformEntry[]; 
    eventTracking: EventTrackingEntry[];
    manualEventMarkers: ManualEventMarker[];
    wlSalesDataForRecalculation: WLSalesPlatformEntry[];
    allGames: string[];
    selectedPlatform: Platform | 'All';
    onPlatformChange: (platform: Platform | 'All') => void;
    onPointClick: (entry: WLSalesPlatformEntry) => void;
    onDeleteWLSalesEntry: (id: string) => void;
    onEditWLSalesEntry: (entry: WLSalesPlatformEntry) => void;
    onAddDailyWLSalesEntry: (newEntry: { date: string, platform: Platform, wishlists: number, sales: number }) => void;
    onAddWLSalesEntry: (newEntry: any) => void; // Adicionado para o formulário detalhado
    isColorConfigOpen: boolean;
    onColorConfigOpenChange: (open: boolean) => void;
    ColorConfigForm: React.FC;
    isHistoryVisible: boolean;
    onHistoryVisibleChange: (visible: boolean) => void;
}

const WLSalesPanelThemed: React.FC<WLSalesPanelThemedProps> = ({
    gameName,
    wlSales,
    eventTracking,
    manualEventMarkers,
    wlSalesDataForRecalculation,
    allGames,
    selectedPlatform,
    onPlatformChange,
    onPointClick,
    onDeleteWLSalesEntry,
    onEditWLSalesEntry,
    onAddDailyWLSalesEntry,
    onAddWLSalesEntry,
    isColorConfigOpen,
    onColorConfigOpenChange,
    ColorConfigForm,
    isHistoryVisible,
    onHistoryVisibleChange,
}) => {
    const [isAddDailyWLSalesFormOpen, setIsAddDailyWLSalesFormOpen] = useState(false);
    const [isAddWLSalesFormOpen, setIsAddWLSalesFormOpen] = useState(false);

    // O tema PlayStation é aplicado globalmente, então usamos as classes PS
    const cardClasses = "ps-card-glow bg-card/50 backdrop-blur-sm border-ps-blue/50";

    return (
        <div className="space-y-6">
            
            {/* --- Filtro de Plataforma (Mantido para filtrar os dados) --- */}
            <Card className={cn("bg-card/50 border-none shadow-none", cardClasses)}>
                <CardContent className="flex flex-col md:flex-row items-center gap-4 p-4">
                    <Label htmlFor="platform-select" className="font-semibold text-ps-light min-w-[150px]">Filtrar por Plataforma:</Label>
                    <Select onValueChange={onPlatformChange} defaultValue={selectedPlatform}>
                        <SelectTrigger id="platform-select" className="w-full md:w-[200px] bg-card border-border text-ps-light">
                            <SelectValue placeholder="Todas as Plataformas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">Todas as Plataformas</SelectItem>
                            {['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Android', 'iOS', 'Epic Games', 'Outra'].map(platform => (
                                <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* --- Conteúdo Principal (Gráfico e Ações) --- */}
            <Card className={cardClasses}>
                <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                    <CardTitle className="text-2xl font-bold text-ps-blue flex items-center">
                        <Gamepad2 className="h-6 w-6 mr-2" /> {gameName} - Evolução WL/Vendas
                    </CardTitle>
                    
                    <div className="flex flex-wrap justify-end gap-2">
                        
                        {/* Botões de Ação de Dados */}
                        <Dialog open={isColorConfigOpen} onOpenChange={onColorConfigOpenChange}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-ps-light border-ps-blue hover:bg-ps-blue/20">
                                    <Palette className="h-4 w-4 mr-2" /> Cores do Gráfico
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[450px] bg-card text-card-foreground border-ps-blue">
                                <DialogHeader>
                                    <DialogTitle className="text-ps-blue">Configurar Cores</DialogTitle>
                                </DialogHeader>
                                <ColorConfigForm />
                            </DialogContent>
                        </Dialog>
                        
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                                // Simula o clique no ponto do gráfico para abrir o menu de ação manual
                                onPointClick({
                                    id: 'temp-today',
                                    date: new Date(),
                                    game: gameName,
                                    platform: selectedPlatform === 'All' ? 'Steam' : selectedPlatform,
                                    wishlists: 0, sales: 0, variation: 0, saleType: 'Padrão', frequency: 'Diário', isPlaceholder: true,
                                });
                            }} 
                            className="text-ps-light border-ps-blue hover:bg-ps-blue/20"
                        >
                            <CalendarPlus className="h-4 w-4 mr-2" /> Marcar Evento Manual
                        </Button>
                        
                        <Button variant="outline" size="sm" onClick={() => onHistoryVisibleChange(!isHistoryVisible)} className="text-ps-light border-ps-blue hover:bg-ps-blue/20">
                            {isHistoryVisible ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                            {isHistoryVisible ? 'Ocultar Histórico' : 'Mostrar Histórico'}
                        </Button>
                        
                        <ExportDataButton 
                            data={wlSales.filter(e => !e.isPlaceholder)}
                            filename={`${gameName}_${selectedPlatform}_WL_Vendas.csv`} 
                            label="WL/Vendas"
                        />
                        
                        {/* Adição Diária Rápida */}
                        <Dialog open={isAddDailyWLSalesFormOpen} onOpenChange={setIsAddDailyWLSalesFormOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsAddDailyWLSalesFormOpen(true)} className="bg-gogo-orange hover:bg-gogo-orange/90 text-white">
                                    <Plus className="h-4 w-4 mr-2" /> Adição Diária Rápida
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[450px] bg-card text-card-foreground border-ps-blue">
                                <DialogHeader>
                                    <DialogTitle className="text-ps-blue">Adição Diária Rápida de Wishlist/Vendas</DialogTitle>
                                </DialogHeader>
                                <AddDailyWLSalesForm 
                                    gameName={gameName}
                                    wlSalesData={wlSalesDataForRecalculation.filter(e => e.platform === selectedPlatform || selectedPlatform === 'All')}
                                    onSave={(data) => onAddDailyWLSalesEntry({ ...data, platform: data.platform })} 
                                    onClose={() => setIsAddDailyWLSalesFormOpen(false)} 
                                />
                            </DialogContent>
                        </Dialog>
                        
                        {/* Adição Detalhada */}
                        <Dialog open={isAddWLSalesFormOpen} onOpenChange={setIsAddWLSalesFormOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsAddWLSalesFormOpen(true)} className="bg-ps-blue hover:bg-ps-blue/90 text-white">
                                    <Plus className="h-4 w-4 mr-2" /> Adicionar WL/Venda (Detalhado)
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-ps-blue">
                                <DialogHeader>
                                    <DialogTitle className="text-ps-blue">Adicionar Entrada Detalhada de Wishlist/Vendas</DialogTitle>
                                </DialogHeader>
                                {/* Reutilizando AddWLSalesForm, que espera a lista de jogos e a função onSave */}
                                <AddWLSalesForm 
                                    games={allGames} 
                                    onSave={onAddWLSalesEntry} 
                                    onClose={() => setIsAddWLSalesFormOpen(false)} 
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                
                <CardContent className="p-4 space-y-6">
                    <WLSalesChartPanel 
                        data={wlSales} 
                        onPointClick={onPointClick} 
                        eventTracking={eventTracking}
                        manualEventMarkers={manualEventMarkers}
                        chartColors={PS_CHART_COLORS}
                        selectedPlatform={selectedPlatform}
                    />
                    
                    {isHistoryVisible && (
                        <WLSalesTablePanel 
                            data={wlSales.filter(e => !e.isPlaceholder)}
                            onDelete={onDeleteWLSalesEntry} 
                            onEdit={onEditWLSalesEntry}
                            games={allGames}
                            selectedPlatform={selectedPlatform}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default WLSalesPanelThemed;