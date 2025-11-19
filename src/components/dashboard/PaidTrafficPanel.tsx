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

interface PaidTrafficPanelProps {
    data: PaidTrafficEntry[];
}

const formatConversion = (value: number | string): string => {
    if (value === '-' || value === '#DIV/0!') return '-';
    return `${(Number(value) * 100).toFixed(2)}%`;
};

const formatCost = (value: number | string): string => {
    if (value === '-' || value === '#DIV/0!') return '-';
    return formatCurrency(Number(value));
};

const PaidTrafficPanel: React.FC<PaidTrafficPanelProps> = ({ data }) => {
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.network}</TableCell>
                                    <TableCell>
                                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                                    </TableCell>
                                    <TableCell className="text-right">{formatNumber(item.impressions)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.clicks)}</TableCell>
                                    <TableCell className="text-center">{formatConversion(item.networkConversion)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.investedValue)}</TableCell>
                                    <TableCell className="text-center">{formatNumber(item.estimatedWishlists)}</TableCell>
                                    <TableCell className="text-right">{formatCost(item.estimatedCostPerWL)}</TableCell>
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