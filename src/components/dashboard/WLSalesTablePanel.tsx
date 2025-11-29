"use client";

import React, { useState } from 'react';
import { WLSalesPlatformEntry, Platform } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber, cn } from '@/lib/utils';
import { Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditWLSalesForm from './EditWLSalesForm';
import PlatformIcon from './PlatformIcon'; // Importar o novo componente

interface WLSalesTablePanelProps {
    data: WLSalesPlatformEntry[];
    onDelete: (id: string) => void;
    onEdit: (entry: WLSalesPlatformEntry) => void;
    games: string[]; // Lista de todos os jogos disponíveis
    selectedPlatform: Platform | 'All'; // NEW PROP
}

const getPlatformColorClass = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase().replace(/\s/g, '').replace(/-/g, '');
    switch (normalizedPlatform) {
        case 'steam': return 'bg-platform-steam hover:bg-platform-steam/90 text-white';
        case 'xbox': return 'bg-platform-xbox hover:bg-platform-xbox/90 text-white';
        case 'playstation': 
        case 'psplus': 
        case 'add-ons': 
        case 'freetoplay': 
        case 'vr': 
            return 'bg-platform-playstation hover:bg-platform-playstation/90 text-white';
        case 'nintendo': return 'bg-platform-nintendo hover:bg-platform-nintendo/90 text-white';
        case 'android': return 'bg-platform-android hover:bg-platform-android/90 text-white';
        case 'ios': return 'bg-platform-ios hover:bg-platform-ios/90 text-white';
        case 'epicgames': return 'bg-platform-epicgames hover:bg-platform-epicgames/90 text-white';
        case 'outra':
        default: return 'bg-platform-outra hover:bg-platform-outra/90 text-white';
    }
};

const WLSalesTablePanel: React.FC<WLSalesTablePanelProps> = ({ data, onDelete, onEdit, games, selectedPlatform }) => {
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    if (data.length === 0) {
        return null;
    }
    
    // Determine theme classes for the card
    const isPlaystation = selectedPlatform === 'Playstation' || selectedPlatform === 'PS Plus' || selectedPlatform === 'Add-Ons' || selectedPlatform === 'Free to Play' || selectedPlatform === 'VR';
    const isNintendo = selectedPlatform === 'Nintendo';
    
    const cardClasses = cn(
        isPlaystation && "ps-card-glow bg-card border-ps-blue/50",
        isNintendo && "nintendo-card-shadow bg-card border-nintendo-red/50",
        !isPlaystation && !isNintendo && "shadow-md"
    );

    // Sort data by date descending (most recent first)
    const sortedData = [...data].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

    return (
        <Card className={cardClasses}>
            <CardHeader>
                <CardTitle>Histórico Diário de Wishlists e Vendas</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-center">Plataforma</TableHead>
                                <TableHead className="text-center">Frequência</TableHead>
                                <TableHead className="text-center">Tipo de Venda</TableHead>
                                <TableHead className="text-right">WL Totais</TableHead>
                                <TableHead className="text-right">Variação Diária</TableHead>
                                <TableHead className="text-right">Vendas Diárias</TableHead>
                                <TableHead className="w-[100px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="default" className={`flex items-center justify-center space-x-1 ${getPlatformColorClass(item.platform)}`}>
                                            <PlatformIcon platform={item.platform} className="h-3 w-3" color="white" />
                                            <span>{item.platform}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{item.frequency}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{item.saleType}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatNumber(item.wishlists)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.variation)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.sales)}</TableCell>
                                    <TableCell className="text-center flex items-center justify-center space-x-1">
                                        
                                        {/* Botão de Edição */}
                                        <Dialog open={openDialogId === item.id} onOpenChange={(open) => setOpenDialogId(open ? item.id : null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gogo-cyan hover:bg-gogo-cyan/10">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[600px]">
                                                <DialogHeader>
                                                    <DialogTitle>Editar Entrada de WL/Vendas</DialogTitle>
                                                </DialogHeader>
                                                <EditWLSalesForm 
                                                    games={games}
                                                    entry={item}
                                                    onSave={onEdit}
                                                    onClose={() => setOpenDialogId(null)}
                                                />
                                            </DialogContent>
                                        </Dialog>

                                        {/* Botão de Exclusão */}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta ação removerá permanentemente o registro de WL/Vendas da data {formatDate(item.date)}.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-destructive hover:bg-destructive/90">
                                                        Remover
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default WLSalesTablePanel;