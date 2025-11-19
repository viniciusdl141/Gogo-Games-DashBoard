"use client";

import React from 'react';
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
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils';
import NetworkIcon from './NetworkIcon';
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

interface PaidTrafficPanelProps {
    data: PaidTrafficEntry[];
    onDeleteTracking: (id: string) => void;
}

const formatConversion = (value: number | string): string => {
    if (value === '-' || value === '#DIV/0!') return '-';
    return `${(Number(value) * 100).toFixed(2)}%`;
};

const formatCost = (value: number | string): string => {
    if (value === '-' || value === '#DIV/0!') return '-';
    return formatCurrency(Number(value));
};

const PaidTrafficPanel: React.FC<PaidTrafficPanelProps> = ({ data, onDeleteTracking }) => {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Tracking de Tráfego Pago</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Nenhum dado de tráfego pago disponível para este jogo.</p></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tracking de Tráfego Pago</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rede</TableHead>
                                <TableHead>Período</TableHead>
                                <TableHead className="text-right">Impressões</TableHead>
                                <TableHead className="text-right">Cliques</TableHead>
                                <TableHead className="text-center">Conversão Rede</TableHead>
                                <TableHead className="text-right">Investido (R$)</TableHead>
                                <TableHead className="text-center">WL Est.</TableHead>
                                <TableHead className="text-right">Custo/WL Est.</TableHead>
                                <TableHead className="w-[50px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={item.id || index}>
                                    <TableCell className="font-medium flex items-center space-x-2">
                                        <NetworkIcon network={item.network} className="h-4 w-4" />
                                        <span>{item.network}</span>
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                                    </TableCell>
                                    <TableCell className="text-right">{formatNumber(item.impressions)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.clicks)}</TableCell>
                                    <TableCell className="text-center">{formatConversion(item.networkConversion)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.investedValue)}</TableCell>
                                    <TableCell className="text-center">{formatNumber(item.estimatedWishlists)}</TableCell>
                                    <TableCell className="text-right">{formatCost(item.estimatedCostPerWL)}</TableCell>
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
                                                        Esta ação removerá permanentemente o registro de tráfego pago para "{item.network}" ({item.game}).
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

export default PaidTrafficPanel;