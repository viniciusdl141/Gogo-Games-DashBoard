"use client";

import React, { useState } from 'react';
import { DemoTrackingEntry } from '@/data/trackingData';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditDemoForm from './EditDemoForm';

interface DemoTrackingPanelProps {
    data: DemoTrackingEntry[];
    onDeleteTracking: (id: string) => void;
    onEditTracking: (entry: DemoTrackingEntry) => void;
}

const DemoTrackingPanel: React.FC<DemoTrackingPanelProps> = ({ data, onDeleteTracking, onEditTracking }) => {
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Tracking da Demo</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Nenhum dado de tracking da demo disponível para este jogo.</p></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tracking da Demo</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Downloads</TableHead>
                                <TableHead className="text-center">Tempo Médio Jogo Demo</TableHead>
                                <TableHead className="text-center">Tempo Total Demo</TableHead>
                                <TableHead className="text-center">Tempo Total Jogo</TableHead>
                                <TableHead className="w-[100px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={item.id || index}>
                                    <TableCell>{formatDate(item.date)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.downloads)}</TableCell>
                                    <TableCell className="text-center">{item.avgPlaytime}</TableCell>
                                    <TableCell className="text-center">{item.totalDemoTime}</TableCell>
                                    <TableCell className="text-center">{item.totalGameTime}</TableCell>
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
                                                    <DialogTitle>Editar Tracking de Demo</DialogTitle>
                                                </DialogHeader>
                                                <EditDemoForm 
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
                                                        Esta ação removerá permanentemente o registro de demo da data {formatDate(item.date)}.
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

export default DemoTrackingPanel;