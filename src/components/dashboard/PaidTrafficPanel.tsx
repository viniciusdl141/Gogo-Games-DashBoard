"use client";

import React, { useState } from 'react';
import { PaidTrafficEntry } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'; // Removed cn
import { Trash2, Edit } from 'lucide-react'; // Removed Megaphone, DollarSign, MousePointerClick, Eye
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditPaidTrafficForm from './EditPaidTrafficForm';

interface PaidTrafficPanelProps {
    data: PaidTrafficEntry[];
    onDeleteTracking: (id: string) => void;
    onEditTracking: (entry: PaidTrafficEntry) => void;
    games: string[];
    isPresentationMode?: boolean; 
}

const PaidTrafficPanel: React.FC<PaidTrafficPanelProps> = ({ data, onDeleteTracking, onEditTracking, games, isPresentationMode = false }) => {
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    if (data.length === 0) {
        return <p className="text-muted-foreground p-4">Nenhum dado de tráfego pago registrado para este jogo.</p>;
    }

    const sortedData = [...data].sort((a, b) => (b.startDate?.getTime() || 0) - (a.startDate?.getTime() || 0));

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Rede</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Investido (R$)</TableHead>
                        <TableHead className="text-right">Impressões</TableHead>
                        <TableHead className="text-right">Cliques</TableHead>
                        <TableHead className="text-right">Conversão Rede</TableHead>
                        <TableHead className="text-right">WL Estimadas</TableHead>
                        <TableHead className="text-right">Custo/WL (Est.)</TableHead>
                        {!isPresentationMode && <TableHead className="w-[100px] text-center">Ações</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedData.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.network}</TableCell>
                            <TableCell>{formatDate(item.startDate)} - {formatDate(item.endDate)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.investedValue)}</TableCell>
                            <TableCell className="text-right">{formatNumber(item.impressions)}</TableCell>
                            <TableCell className="text-right">{formatNumber(item.clicks)}</TableCell>
                            <TableCell className="text-right">{(item.networkConversion * 100).toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{formatNumber(item.estimatedWishlists)}</TableCell>
                            <TableCell className="text-right">{item.estimatedCostPerWL !== '-' ? formatCurrency(Number(item.estimatedCostPerWL)) : '-'}</TableCell>
                            
                            {!isPresentationMode && (
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
                                                <DialogTitle>Editar Entrada de Tráfego Pago</DialogTitle>
                                            </DialogHeader>
                                            <EditPaidTrafficForm 
                                                games={games}
                                                entry={item}
                                                onSave={onEditTracking}
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
                                                    Esta ação removerá permanentemente o registro de tráfego pago para {item.network}.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteTracking(item.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Remover
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default PaidTrafficPanel;