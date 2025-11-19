"use client";

import React from 'react';
import { ResultSummaryEntry } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ResultSummaryPanelProps {
    data: ResultSummaryEntry[];
}

const formatValue = (key: keyof ResultSummaryEntry, value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '' || value === '#DIV/0!' || (typeof value === 'number' && isNaN(value))) return '-';
    
    const numValue = Number(value);

    if (typeof value === 'string' && value.startsWith('R$')) return value;

    if (key.includes('Custo') || key.includes('Real/')) {
        // Se for um custo ou valor monetário, formatar como moeda
        return formatCurrency(numValue);
    }
    if (key.includes('Conversão') || key.includes('WL/Real')) {
        // Se for uma taxa de conversão ou WL/Real
        if (key === 'Conversão vendas/wl') {
             return `${(numValue * 100).toFixed(2)}%`;
        }
        // Se for WL/Real, mostrar 2 casas decimais
        return numValue.toFixed(2);
    }
    if (key.includes('Visualizações') || key.includes('Visitas')) {
        return numValue.toFixed(2);
    }
    return String(value);
};

const getColumnTitle = (key: keyof ResultSummaryEntry) => {
    const titleMap: Record<keyof ResultSummaryEntry, string> = {
        type: 'Tipo',
        game: 'Jogo',
        'Visualizações/Real': 'Views / R$',
        'Visitas/Real': 'Visitas / R$',
        'WL/Real': 'WL / R$',
        'Real/Visualizações': 'R$ / View',
        'Real/Visitas': 'R$ / Visita',
        'Real/WL': 'R$ / WL',
        'Custo por venda': 'Custo / Venda',
        'Conversão vendas/wl': 'Conversão Vendas/WL',
    };
    return titleMap[key] || key.replace('/', ' / ');
};

const ResultSummaryPanel: React.FC<ResultSummaryPanelProps> = ({ data }) => {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Resumo de Resultados</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Nenhum resumo de resultados disponível para este jogo.</p></CardContent>
            </Card>
        );
    }

    // Filter out keys that are always undefined or not relevant for display
    const allKeys = Object.keys(data[0]).filter(key => key !== 'game' && key !== 'type') as (keyof ResultSummaryEntry)[];
    
    // Determine which columns actually have data across all rows
    const columnsToShow = allKeys.filter(key => 
        data.some(row => row[key] !== undefined && row[key] !== null && row[key] !== '' && row[key] !== '#DIV/0!' && !(typeof row[key] === 'number' && isNaN(row[key])))
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumo de Resultados por Tipo de Campanha</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Tipo</TableHead>
                                {columnsToShow.map(key => (
                                    <TableHead key={key} className="text-center min-w-[100px]">
                                        <div className="flex items-center justify-center space-x-1">
                                            <span>{getColumnTitle(key)}</span>
                                            {key === 'WL/Real' && (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Wishlists geradas por Real investido.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{row.type}</TableCell>
                                    {columnsToShow.map(key => (
                                        <TableCell key={`${index}-${key}`} className="text-center">
                                            {formatValue(key, row[key])}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default ResultSummaryPanel;