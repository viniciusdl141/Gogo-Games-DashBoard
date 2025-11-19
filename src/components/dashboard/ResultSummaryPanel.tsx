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

interface ResultSummaryPanelProps {
    data: ResultSummaryEntry[];
}

const formatValue = (key: keyof ResultSummaryEntry, value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '' || value === '#DIV/0!') return '-';
    
    const numValue = Number(value);

    if (typeof value === 'string' && value.startsWith('R$')) return value;

    if (key.includes('Custo') || key.includes('Real/')) {
        return formatCurrency(numValue);
    }
    if (key.includes('Conversão') || key.includes('WL/Real')) {
        // Assuming these are ratios/percentages
        if (typeof value === 'string' && value.includes('%')) return value;
        return `${(numValue * 100).toFixed(2)}%`;
    }
    if (key.includes('Visualizações') || key.includes('Visitas')) {
        return numValue.toFixed(2);
    }
    return String(value);
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
        data.some(row => row[key] !== undefined && row[key] !== null && row[key] !== '' && row[key] !== '#DIV/0!')
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
                                    <TableHead key={key} className="text-center min-w-[100px]">{key.replace('/', ' / ')}</TableHead>
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