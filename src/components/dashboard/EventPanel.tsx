"use client";

import React, { useState } from 'react';
import { EventTrackingEntry } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditEventForm from './EditEventForm';

interface EventPanelProps {
    data: EventTrackingEntry[];
    onDeleteTracking: (id: string) => void;
    onEditTracking: (entry: EventTrackingEntry) => void;
    games: string[];
    isPresentationMode?: boolean; 
}

const EventPanel: React.FC<EventPanelProps> = ({ data, onDeleteTracking, onEditTracking, games, isPresentationMode = false }) => {
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    if (data.length === 0) {
        return <p className="text-muted-foreground p-4">Nenhum dado de tracking de evento registrado.</p>;
    }

    const sortedData = [...data].sort((a, b) => (b.startDate?.getTime() || 0) - (a.startDate?.getTime() || 0));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Evento</TableHead>
                                <TableHead>Período</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead className="text-right">Custo (R$)</TableHead>
                                <TableHead className="text-right">WL Geradas</TableHead>
                                <TableHead className="text-right">Visualizações</TableHead>
                                <TableHead className="text-right">ROI (R$/WL)</TableHead>
                                {!isPresentationMode && <TableHead className="w-[100px] text-center">Ações</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.event}</TableCell>
                                    <TableCell>{formatDate(item.startDate)} - {formatDate(item.endDate)}</TableCell>
                                    <TableCell>{item.action}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.wlGenerated)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.views)}</TableCell>
                                    <TableCell className="text-right">{item.roi !== '-' ? formatCurrency(Number(item.roi)) : '-'}</TableCell>
                                    
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
                                                        <DialogTitle>Editar Entrada de Evento</DialogTitle>
                                                    </DialogHeader>
                                                    <EditEventForm 
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
                                                            Esta ação removerá permanentemente o registro do evento {item.event}.
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
            </CardContent>
        </Card>
    );
};

export default EventPanel;