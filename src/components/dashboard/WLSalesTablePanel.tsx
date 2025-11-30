import React, { useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatNumber, cn } from '@/lib/utils';
import { Trash2, Edit } from 'lucide-react';
import { WLSalesEntry } from '@/data/trackingData';
import WLSalesActionMenu from './WLSalesActionMenu';
import ExportDataButton from './ExportDataButton';

interface WLSalesTablePanelProps {
    wlSalesData: WLSalesEntry[];
    onDeleteEntry: (id: string) => void;
}

const WLSalesTablePanel: React.FC<WLSalesTablePanelProps> = ({ wlSalesData, onDeleteEntry }) => {
    const sortedData = useMemo(() => {
        return [...wlSalesData].sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [wlSalesData]);

    return (
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Tabela de Dados Brutos</CardTitle>
                <ExportDataButton data={sortedData} filename="wl_sales_data" />
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Data</TableHead>
                                <TableHead>Plataforma</TableHead>
                                <TableHead className="text-right">Wishlists</TableHead>
                                <TableHead className="text-right">Vendas</TableHead>
                                <TableHead className="text-right">Variação (%)</TableHead>
                                <TableHead className="text-right">Tipo</TableHead>
                                <TableHead className="text-right">Frequência</TableHead>
                                <TableHead className="w-[50px] text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedData.length > 0 ? (
                                sortedData.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{formatDate(entry.date)}</TableCell>
                                        <TableCell>{entry.platform}</TableCell>
                                        <TableCell className="text-right">{formatNumber(entry.wishlists)}</TableCell>
                                        <TableCell className="text-right font-medium text-gogo-green">{formatNumber(entry.sales)}</TableCell>
                                        <TableCell className={cn("text-right", entry.variation >= 0 ? "text-gogo-green" : "text-gogo-orange")}>
                                            {entry.variation.toFixed(2)}%
                                        </TableCell>
                                        <TableCell className="text-right">{entry.saleType}</TableCell>
                                        <TableCell className="text-right">{entry.frequency}</TableCell>
                                        <TableCell className="text-right">
                                            <WLSalesActionMenu entry={entry} onDelete={() => onDeleteEntry(entry.id)} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                                        Nenhuma entrada de WL/Vendas encontrada.
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

export default WLSalesTablePanel;