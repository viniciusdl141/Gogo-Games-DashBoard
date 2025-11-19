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

interface InfluencerPanelProps {
    summary: InfluencerSummaryEntry[];
    tracking: InfluencerTrackingEntry[];
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

const InfluencerTrackingTable: React.FC<{ data: InfluencerTrackingEntry[] }> = ({ data }) => (
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
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item, index) => (
                    <TableRow key={index}>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell className="font-medium">{item.influencer}</TableCell>
                        <TableCell>{item.platform}</TableCell>
                        <TableCell>{item.action}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.views)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.investment)}</TableCell>
                        <TableCell className="text-center">{formatNumber(item.estimatedWL)}</TableCell>
                        <TableCell className="text-right">{formatROI(item.roi)}</TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{item.observations || '-'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);

const InfluencerPanel: React.FC<InfluencerPanelProps> = ({ summary, tracking }) => {
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
                    <InfluencerSummaryTable data={summary} />
                )}
                {summary.length > 0 && tracking.length > 0 && <Separator className="my-6" />}
                {tracking.length > 0 && (
                    <InfluencerTrackingTable data={tracking} />
                )}
            </CardContent>
        </Card>
    );
};

export default InfluencerPanel;