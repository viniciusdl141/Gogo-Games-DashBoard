"use client";

import React from 'react';
import { WLSalesPlatformEntry, ManualEventMarker } from '@/data/trackingData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, CalendarPlus, List, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import EditWLSalesForm from './EditWLSalesForm';
import ManualEventMarkerForm from './ManualEventMarkerForm';
import { startOfDay } from 'date-fns';

interface WLSalesActionMenuProps {
    entry: WLSalesPlatformEntry;
    existingMarker?: ManualEventMarker;
    gameName: string;
    onEditWLSales: (entry: WLSalesPlatformEntry) => void;
    onSaveManualMarker: (values: { date: string, name: string }) => void;
    onDeleteManualMarker: (id: string) => void;
    children: React.ReactNode;
}

const WLSalesActionMenu: React.FC<WLSalesActionMenuProps> = ({ 
    entry, 
    existingMarker,
    gameName,
    onEditWLSales, 
    onSaveManualMarker,
    onDeleteManualMarker,
    children 
}) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isWLSalesDialogOpen, setIsWLSalesDialogOpen] = React.useState(false);
    const [isMarkerDialogOpen, setIsMarkerDialogOpen] = React.useState(false);

    const isRealData = !entry.isPlaceholder;
    const dateString = entry.date ? entry.date.toISOString().split('T')[0] : '';

    const handleEditWLSales = () => {
        setIsWLSalesDialogOpen(true);
        setIsMenuOpen(false);
    };

    const handleEditMarker = () => {
        setIsMarkerDialogOpen(true);
        setIsMenuOpen(false);
    };

    return (
        <>
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                    {children}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                        Ações para {formatDate(entry.date)}
                    </div>
                    <DropdownMenuSeparator />

                    {isRealData && (
                        <DropdownMenuItem onClick={handleEditWLSales} className="cursor-pointer">
                            <List className="mr-2 h-4 w-4" /> Editar Dados WL/Vendas
                        </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={handleEditMarker} className="cursor-pointer">
                        <CalendarPlus className="mr-2 h-4 w-4" /> 
                        {existingMarker ? 'Editar Marcador Manual' : 'Adicionar Marcador Manual'}
                    </DropdownMenuItem>

                    {!isRealData && (
                        <DropdownMenuItem disabled className="text-muted-foreground/70">
                            <List className="mr-2 h-4 w-4" /> Sem dados de WL/Vendas para editar
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialog for editing WL Sales entry */}
            <Dialog open={isWLSalesDialogOpen} onOpenChange={setIsWLSalesDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Editar Entrada de WL/Vendas</DialogTitle>
                    </DialogHeader>
                    <EditWLSalesForm 
                        games={[gameName]} // Pass only the current game name
                        entry={entry}
                        onSave={onEditWLSales}
                        onClose={() => setIsWLSalesDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog for Manual Event Marker */}
            <Dialog open={isMarkerDialogOpen} onOpenChange={setIsMarkerDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>{existingMarker ? 'Editar Marcador de Evento' : 'Adicionar Marcador de Evento'}</DialogTitle>
                    </DialogHeader>
                    <ManualEventMarkerForm 
                        gameName={gameName}
                        existingMarker={existingMarker}
                        onSave={onSaveManualMarker}
                        onDelete={onDeleteManualMarker}
                        onClose={() => setIsMarkerDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default WLSalesActionMenu;