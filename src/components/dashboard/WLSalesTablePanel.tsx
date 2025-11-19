"use client";

import React, { useState } from 'react';
import { WLSalesEntry } from '@/data/trackingData';
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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditWLSalesForm from './EditWLSalesForm';

interface WLSalesTablePanelProps {
    data: WLSalesEntry[];
    onDelete: (id: string) => void;
    onEdit: (entry: WLSalesEntry) => void;
    games: string[];
}

const WLSalesTablePanel: React.FC<WLSalesTablePanelProps> = ({ data, onDelete, onEdit, games }) => {
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    if (data.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Histórico Diário de Wishlists e Vendas</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-center">Frequência</TableHead>
                                <TableHead className="text-center">Tipo de Venda</TableHead>
                                <TableHead className="text-right">WL Totais</TableHead>
                                <TableHead className="text-right">Variação Diária</TableHead>
                                <TableHead className="text-right">Vendas Diárias</TableHead>
                                <TableHead className="w-[100px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{item.frequency}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{item.saleType}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{formatNumber(item.wishlists)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.variation)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.sales)}</TableCell>
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
                                                    <DialogTitle>Editar Entrada de WL/Vendas</DialogTitle>
                                                </DialogHeader>
                                                <EditWLSalesForm 
                                                    games={games}
                                                    entry={item}
                                                    onSave={onEdit}
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
                                                        Esta ação removerá permanentemente o registro de WL/Vendas da data {formatDate(item.date)}.
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

export default WLSalesTablePanel;