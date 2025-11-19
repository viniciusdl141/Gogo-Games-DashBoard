"use client";

import React from 'react';
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

interface DemoTrackingPanelProps {
    data: DemoTrackingEntry[];
}

const DemoTrackingPanel: React.FC<DemoTrackingPanelProps> = ({ data }) => {
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{formatDate(item.date)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.downloads)}</TableCell>
                                    <TableCell className="text-center">{item.avgPlaytime}</TableCell>
                                    <TableCell className="text-center">{item.totalDemoTime}</TableCell>
                                    <TableCell className="text-center">{item.totalGameTime}</TableCell>
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