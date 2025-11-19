"use client";

import React from 'react';
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
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
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

interface EventPanelProps {
    data: EventTrackingEntry[];
    onDeleteTracking: (id: string) => void;
}

const formatROI = (value: number | string): string => {
    if (value === '-' || value === '#DIV/0!') return '-';
    return formatCurrency(Number(value));
};

const formatCostPerView = (value: number | string): string => {
    if (value === '-' || value === '#DIV/0!') return '-';
    return formatCurrency(Number(value));
};

const EventPanel: React.FC<EventPanelProps> = ({ data, onDeleteTracking }) => {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Tracking de Eventos</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Nenhum dado de tracking de eventos disponível para este jogo.</p></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tracking de Eventos</CardTitle>
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
                                <TableHead className="text-center">WL Geradas</TableHead>
                                <TableHead className="text-right">ROI (R$/WL)</TableHead>
                                <TableHead className="text-right">Custo/View</TableHead>
                                <TableHead className="w-[50px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={item.id || index}>
                                    <TableCell className="font-medium">{item.event}</TableCell>
                                    <TableCell>
                                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                                    </TableCell>
                                    <TableCell>{item.action}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                                    <TableCell className="text-center">{formatNumber(item.wlGenerated)}</TableCell>
                                    <TableCell className="text-right">{formatROI(item.roi)}</TableCell>
                                    <TableCell className="text-right">{formatCostPerView(item.costPerView)}</TableCell>
                                    <TableCell className="text-center">
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
                                                        Esta ação removerá permanentemente o registro do evento "{item.event}" ({item.game}).
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