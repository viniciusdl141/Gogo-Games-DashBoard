"use client";

import React, { useState } from 'react';
import { TrafficEntry } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber } from '@/lib/utils';
import { Trash2, Edit, Globe } from 'lucide-react';
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
import PlatformIcon from './PlatformIcon';

interface TrafficPanelProps {
    data: TrafficEntry[];
    onDelete: (id: string) => void;
    // onEdit: (entry: TrafficEntry) => void; // Edit functionality can be added later
}

const TrafficPanel: React.FC<TrafficPanelProps> = ({ data, onDelete }) => {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Tracking de Tráfego/Visitas</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Nenhum dado de tráfego manual disponível para este jogo.</p></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tracking de Tráfego/Visitas</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Período</TableHead>
                                <TableHead>Plataforma</TableHead>
                                <TableHead>Fonte</TableHead>
                                <TableHead className="text-right">Visitas/Views</TableHead>
                                <TableHead className="text-right">Impressões</TableHead>
                                <TableHead className="text-right">Cliques</TableHead>
                                <TableHead className="w-[50px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="flex items-center space-x-1">
                                            <PlatformIcon platform={item.platform} className="h-3 w-3" />
                                            <span>{item.platform}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.source}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.visits)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.impressions)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.clicks)}</TableCell>
                                    <TableCell className="text-center">
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
                                                        Esta ação removerá permanentemente o registro de tráfego da fonte "{item.source}".
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

export default TrafficPanel;