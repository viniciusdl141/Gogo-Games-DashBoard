"use client";

import React, { useState } from 'react';
import { WLSalesPlatformEntry, ManualEventMarker, InfluencerTrackingEntry, EventTrackingEntry, PaidTrafficEntry, DemoTrackingEntry } from '@/data/trackingData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, CalendarPlus, List, Trash2, ArrowLeft, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import EditWLSalesForm from './EditWLSalesForm';
import ManualEventMarkerForm from './ManualEventMarkerForm';
import DailySummaryPanel from './DailySummaryPanel'; // Novo Import

interface WLSalesActionMenuProps {
    entry: WLSalesPlatformEntry;
    existingMarker?: ManualEventMarker;
    gameName: string;
    onEditWLSales: (entry: WLSalesPlatformEntry) => void;
    onSaveManualMarker: (values: { date: string, name: string }) => void;
    onDeleteManualMarker: (id: string) => void;
    onClose: () => void; // Adicionado para fechar o diálogo principal
    // Novos props para o resumo diário
    allInfluencerTracking: InfluencerTrackingEntry[];
    allEventTracking: EventTrackingEntry[];
    allPaidTraffic: PaidTrafficEntry[];
    allDemoTracking: DemoTrackingEntry[];
    allManualEventMarkers: ManualEventMarker[];
}

const WLSalesActionMenu: React.FC<WLSalesActionMenuProps> = ({ 
    entry, 
    existingMarker,
    gameName,
    onEditWLSales, 
    onSaveManualMarker,
    onDeleteManualMarker,
    onClose,
    allInfluencerTracking,
    allEventTracking,
    allPaidTraffic,
    allDemoTracking,
    allManualEventMarkers,
}) => {
    const [currentView, setCurrentView] = useState<'menu' | 'edit-wl' | 'edit-marker' | 'daily-summary'>('menu');
    const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);

    const isRealData = !entry.isPlaceholder;
    const dateString = entry.date ? entry.date.toISOString().split('T')[0] : '';

    const handleViewSummary = () => {
        setIsSummaryDialogOpen(true);
        // Não fechar o menu principal, apenas abrir o sub-diálogo
    };

    const renderContent = () => {
        switch (currentView) {
            case 'edit-wl':
                if (!isRealData) return <p className="p-4 text-muted-foreground">Nenhum dado de WL/Vendas para editar nesta data.</p>;
                return (
                    <EditWLSalesForm 
                        games={[gameName]}
                        entry={entry}
                        onSave={onEditWLSales}
                        onClose={onClose} // Fecha o diálogo principal após salvar
                    />
                );
            case 'edit-marker':
                return (
                    <ManualEventMarkerForm 
                        gameName={gameName}
                        existingMarker={existingMarker}
                        onSave={onSaveManualMarker}
                        onDelete={onDeleteManualMarker}
                        onClose={onClose} // Fecha o diálogo principal após salvar/remover
                    />
                );
            case 'daily-summary':
                // Este caso não deve ser alcançado, pois o resumo será aberto em um diálogo separado.
                return null; 
            case 'menu':
            default:
                return (
                    <div className="p-4 space-y-4">
                        <p className="text-lg font-semibold text-foreground">Ações para {formatDate(entry.date)}</p>
                        
                        <Button 
                            onClick={handleViewSummary} 
                            className="w-full justify-start bg-gogo-cyan/10 text-gogo-cyan hover:bg-gogo-cyan/20 border border-gogo-cyan"
                        >
                            <Search className="mr-2 h-4 w-4" /> Ver Detalhes do Dia
                        </Button>

                        {isRealData ? (
                            <Button 
                                onClick={() => setCurrentView('edit-wl')} 
                                className="w-full justify-start bg-gogo-cyan hover:bg-gogo-cyan/90 text-white"
                            >
                                <List className="mr-2 h-4 w-4" /> Editar Dados WL/Vendas
                            </Button>
                        ) : (
                            <Button 
                                disabled 
                                variant="outline" 
                                className="w-full justify-start text-muted-foreground/70"
                            >
                                <List className="mr-2 h-4 w-4" /> Sem dados de WL/Vendas para editar
                            </Button>
                        )}

                        <Button 
                            onClick={() => setCurrentView('edit-marker')} 
                            className="w-full justify-start bg-gogo-orange hover:bg-gogo-orange/90 text-white"
                        >
                            <CalendarPlus className="mr-2 h-4 w-4" /> 
                            {existingMarker ? 'Editar Marcador Manual' : 'Adicionar Marcador Manual'}
                        </Button>

                        <Button variant="outline" onClick={onClose} className="w-full mt-4">
                            Cancelar
                        </Button>
                    </div>
                );
        }
    };

    const getDialogTitle = () => {
        switch (currentView) {
            case 'edit-wl': return 'Editar Entrada de WL/Vendas';
            case 'edit-marker': return existingMarker ? 'Editar Marcador de Evento' : 'Adicionar Marcador de Evento';
            case 'menu':
            default: return 'Selecione uma Ação';
        }
    };

    const getDialogClass = () => {
        if (currentView === 'edit-marker') return 'sm:max-w-[450px]';
        if (currentView === 'edit-wl') return 'sm:max-w-[600px]';
        return 'sm:max-w-[400px]'; // Menu view
    };

    return (
        <>
            <div className={getDialogClass()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        {currentView !== 'menu' && (
                            <Button variant="ghost" size="icon" onClick={() => setCurrentView('menu')} className="mr-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        {getDialogTitle()}
                    </DialogTitle>
                </DialogHeader>
                {renderContent()}
            </div>

            {/* Diálogo de Resumo Diário (Abre sobre o menu de ação) */}
            <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalhes de Tracking Diário</DialogTitle>
                    </DialogHeader>
                    {entry.date && (
                        <DailySummaryPanel 
                            date={entry.date}
                            gameName={gameName}
                            wlSales={allWLSales}
                            influencerTracking={allInfluencerTracking}
                            eventTracking={allEventTracking}
                            paidTraffic={allPaidTraffic}
                            demoTracking={allDemoTracking}
                            manualEventMarkers={allManualEventMarkers}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default WLSalesActionMenu;