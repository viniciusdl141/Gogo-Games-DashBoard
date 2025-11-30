import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResultSummaryEntry } from '@/data/trackingData';
import { List } from 'lucide-react';

interface ResultSummaryPanelProps {
    data: ResultSummaryEntry[];
}

const HEADER_MAP: Record<keyof ResultSummaryEntry, string> = {
    game: 'Jogo',
    type: 'Tipo de Ação',
    'WL/Real': 'WL / R$',
    'Real/WL': 'R$ / WL',
    'Custo por venda': 'Custo / Venda',
    'Conversão vendas/wl': 'Conversão Vendas/WL',
};

const ResultSummaryPanel: React.FC<ResultSummaryPanelProps> = ({ data }) => {
    const headers = useMemo(() => {
        if (data.length === 0) return [];
        return Object.keys(data[0]) as (keyof ResultSummaryEntry)[];
    }, [data]);

    return (
        <Card className="shadow-lg border-t-4 border-gogo-orange">
            <CardHeader>
                <CardTitle className="text-xl text-gogo-orange flex items-center">
                    <List className="h-5 w-5 mr-2" /> Resumo de Resultados por Ação
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {headers.map(key => (
                                    <TableHead key={key} className={key !== 'type' && key !== 'game' ? 'text-right' : ''}>
                                        {HEADER_MAP[key]}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((entry, index) => (
                                    <TableRow key={index}>
                                        {headers.map(key => (
                                            <TableCell key={key} className={key !== 'type' && key !== 'game' ? 'text-right font-medium' : 'font-medium'}>
                                                {entry[key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={Object.keys(HEADER_MAP).length} className="h-24 text-center text-gray-500">
                                        Nenhum dado de resumo disponível.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default ResultSummaryPanel;