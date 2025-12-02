"use client";

import React, { useState } from 'react';
import { InfluencerSummaryEntry, InfluencerTrackingEntry } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'; // Removed cn
import { Trash2, Edit, Users, TrendingUp } from 'lucide-react'; // Removed DollarSign
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
import EditInfluencerForm from './EditInfluencerForm';

interface InfluencerPanelProps {
    summary: InfluencerSummaryEntry[];
    tracking: InfluencerTrackingEntry[];
    onDeleteTracking: (id: string) => void;
    onEditTracking: (entry: InfluencerTrackingEntry) => void;
    games: string[];
    isPresentationMode?: boolean; 
}

const InfluencerPanel: React.FC<InfluencerPanelProps> = ({ summary, tracking, onDeleteTracking, onEditTracking, games, isPresentationMode = false }) => {
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    if (tracking.length === 0 && summary.length === 0) {
        return <p className="text-muted-foreground p-4">Nenhum dado de tracking de influencer registrado.</p>;
    }

    const sortedTracking = [...tracking].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

    return (
        <div className="space-y-6">
            {/* Summary Table */}
            {summary.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                            <Users className="h-4 w-4 mr-2" /> Resumo por Influencer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Influencer</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                        <TableHead className="text-right">Investimento (R$)</TableHead>
                                        <TableHead className="text-right">WL Geradas</TableHead>
                                        <TableHead className="text-right">ROI Médio (R$/WL)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.influencer}</TableCell>
                                            <TableCell className="text-right">{item.totalActions}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.totalInvestment)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(item.wishlistsGenerated)}</TableCell>
                                            <TableCell className="text-right">{item.avgROI !== '-' ? formatCurrency(Number(item.avgROI)) : '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detailed Tracking Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" /> Histórico Detalhado
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Influencer</TableHead>
                                    <TableHead>Plataforma</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead className="text-right">Visualizações</TableHead>
                                    <TableHead className="text-right">Investimento (R$)</TableHead>
                                    <TableHead className="text-right">WL Estimadas</TableHead>
                                    <TableHead className="text-right">ROI (R$/WL)</TableHead>
                                    {!isPresentationMode && <TableHead className="w-[100px] text-center">Ações</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTracking.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{formatDate(item.date)}</TableCell>
                                        <TableCell className="font-medium">{item.influencer}</TableCell>
                                        <TableCell>{item.platform}</TableCell>
                                        <TableCell>{item.action}</TableCell>
                                        <TableCell className="text-right">{formatNumber(item.views)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.investment)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(item.estimatedWL)}</TableCell>
                                        <TableCell className="text-right">{item.roi !== '-' ? formatCurrency(Number(item.roi)) : '-'}</TableCell>
                                        
                                        {!isPresentationMode && (
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
                                                            <DialogTitle>Editar Entrada de Influencer</DialogTitle>
                                                        </DialogHeader>
                                                        <EditInfluencerForm 
                                                            games={games}
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
                                                                Esta ação removerá permanentemente o registro de {item.influencer}.
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
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default InfluencerPanel;