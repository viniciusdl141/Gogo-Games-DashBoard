"use client";

import React from 'react';
import { InfluencerTrackingEntry, InfluencerSummaryEntry } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { Trash2, BarChart3 } from 'lucide-react';
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
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface InfluencerPanelProps {
    summary: InfluencerSummaryEntry[];
    tracking: InfluencerTrackingEntry[];
    onDeleteTracking: (id: string) => void;
}

const formatROI = (value: number | string): string => {
    if (value === '-' || value === '#DIV/0!') return '-';
    if (typeof value === 'string' && value.startsWith('R$')) return value;
    return formatCurrency(Number(value));
};

const InfluencerSummaryTable: React.FC<{ data: InfluencerSummaryEntry[] }> = ({ data }) => (
    <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-2">Resumo por Influencer</h3>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Influencer</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                    <TableHead className="text-right">Investimento</TableHead>
                    <TableHead className="text-center">WL Geradas</TableHead>
                    <TableHead className="text-right">ROI Médio (R$/WL)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{item.influencer}</TableCell>
                        <TableCell className="text-center">{item.totalActions}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.totalInvestment)}</TableCell>
                        <TableCell className="text-center">{formatNumber(item.wishlistsGenerated)}</TableCell>
                        <TableCell className="text-right">{formatROI(item.avgROI)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);

const InfluencerTrackingTable: React.FC<{ data: InfluencerTrackingEntry[], onDelete: (id: string) => void }> = ({ data, onDelete }) => (
    <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-2 mt-6">Tracking Semanal Detalhado</h3>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Investimento</TableHead>
                    <TableHead className="text-center">WL Est.</TableHead>
                    <TableHead className="text-right">ROI (R$/WL)</TableHead>
                    <TableHead>Obs.</TableHead>
                    <TableHead className="w-[50px] text-center">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell className="font-medium">{item.influencer}</TableCell>
                        <TableCell>{item.platform}</TableCell>
                        <TableCell>{item.action}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.views)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.investment)}</TableCell>
                        <TableCell className="text-center">{formatNumber(item.estimatedWL)}</TableCell>
                        <TableCell className="text-right">{formatROI(item.roi)}</TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{item.observations || '-'}</TableCell>
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
                                            Esta ação removerá permanentemente o registro de tracking do influencer {item.influencer} na data {formatDate(item.date)}.
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
);

const InfluencerBarChart: React.FC<{ data: InfluencerSummaryEntry[] }> = ({ data }) => {
    const chartData = data.map(item => ({
        influencer: item.influencer,
        Investimento: item.totalInvestment,
        Wishlists: item.wishlistsGenerated,
    }));

    // Cores Gogo Games: Roxo para Investimento, Verde para Wishlists
    const INVESTMENT_COLOR = "#8b5cf6"; // Violet 500
    const WL_COLOR = "#10b981"; // Emerald 500

    return (
        <div className="h-[300px] w-full mt-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" /> Comparativo: Investimento vs. Wishlists
            </h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="influencer" angle={-15} textAnchor="end" height={50} stroke="hsl(var(--foreground))" />
                    <YAxis yAxisId="left" orientation="left" stroke={INVESTMENT_COLOR} tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis yAxisId="right" orientation="right" stroke={WL_COLOR} />
                    <Tooltip formatter={(value, name) => [name === 'Investimento' ? formatCurrency(value as number) : formatNumber(value as number), name]} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Investimento" fill={INVESTMENT_COLOR} />
                    <Bar yAxisId="right" dataKey="Wishlists" fill={WL_COLOR} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};


const InfluencerPanel: React.FC<InfluencerPanelProps> = ({ summary, tracking, onDeleteTracking }) => {
    const hasData = summary.length > 0 || tracking.length > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Performance de Influencers</CardTitle>
            </CardHeader>
            <CardContent>
                {!hasData && (
                    <p className="text-muted-foreground">Nenhum dado de tracking de influencers disponível para este jogo.</p>
                )}
                
                {summary.length > 0 && (
                    <InfluencerBarChart data={summary} />
                )}

                {summary.length > 0 && <Separator className="my-6" />}

                {summary.length > 0 && (
                    <InfluencerSummaryTable data={summary} />
                )}
                
                {tracking.length > 0 && <Separator className="my-6" />}
                
                {tracking.length > 0 && (
                    <InfluencerTrackingTable data={tracking} onDelete={onDeleteTracking} />
                )}
            </CardContent>
        </Card>
    );
};

export default InfluencerPanel;