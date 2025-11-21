"use client";

import React, { useState } from 'react';
import { WLSalesPlatformEntry, ManualEventMarker } from '@/data/trackingData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, CalendarPlus, List, Trash2, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import EditWLSalesForm from './EditWLSalesForm';
import ManualEventMarkerForm from './ManualEventMarkerForm';

interface WLSalesActionMenuProps {
    entry: WLSalesPlatformEntry;
    existingMarker?: ManualEventMarker;
    gameName: string;
    onEditWLSales: (entry: WLSalesPlatformEntry) => void;
    onSaveManualMarker: (values: { date: string, name: string }) => void;
    onDeleteManualMarker: (id: string) => void;
    onClose: () => void; // Adicionado para fechar o diálogo principal
}

const WLSalesActionMenu: React.FC<WLSalesActionMenuProps> = ({ 
    entry, 
    existingMarker,
    gameName,
    onEditWLSales, 
    onSaveManualMarker,
    onDeleteManualMarker,
    onClose
}) => {
    const [currentView, setCurrentView] = useState<'menu' | 'edit-wl' | 'edit-marker'>('menu');

    const isRealData = !entry.isPlaceholder;
    const dateString = entry.date ? entry.date.toISOString().split('T')[0] : '';

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
            case 'menu':
            default:
                return (
                    <div className="p-4 space-y-4">
                        <p className="text-lg font-semibold text-foreground">Ações para {formatDate(entry.date)}</p>
                        
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
            default: return 'Selecione uma Ação';
        }
    };

    const getDialogClass = () => {
        if (currentView === 'edit-marker') return 'sm:max-w-[450px]';
        if (currentView === 'edit-wl') return 'sm:max-w-[600px]';
        return 'sm:max-w-[400px]'; // Menu view
    };

    return (
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
    );
};

export default WLSalesActionMenu;