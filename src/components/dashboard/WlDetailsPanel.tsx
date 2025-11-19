"use client";

import React from 'react';
import { WlDetails } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from '@/lib/utils';

interface WlDetailsPanelProps {
    details: WlDetails | undefined;
}

const WlDetailsPanel: React.FC<WlDetailsPanelProps> = ({ details }) => {
    if (!details || (details.reviews.length === 0 && details.bundles.length === 0 && details.traffic.length === 0)) {
        return null; // Don't render if there's no extra data
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Detalhes Adicionais da Página Steam</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {details.reviews.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Análise de Reviews</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="text-center">Total</TableHead>
                                    <TableHead className="text-center">Positivas</TableHead>
                                    <TableHead className="text-center">Negativas</TableHead>
                                    <TableHead className="text-center">%</TableHead>
                                    <TableHead>Classificação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {details.reviews.map((r, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{formatDate(r.date)}</TableCell>
                                        <TableCell className="text-center">{r.reviews}</TableCell>
                                        <TableCell className="text-center">{r.positive}</TableCell>
                                        <TableCell className="text-center">{r.negative}</TableCell>
                                        <TableCell className="text-center">{`${(r.percentage * 100).toFixed(0)}%`}</TableCell>
                                        <TableCell>{r.rating}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                {details.bundles.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold mb-2">Vendas de Bundles & DLCs</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Bundle Units</TableHead>
                                    <TableHead>Package Units</TableHead>
                                    <TableHead>Sales</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {details.bundles.map((b, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{b.name}</TableCell>
                                        <TableCell>{b.bundleUnits}</TableCell>
                                        <TableCell>{b.packageUnits}</TableCell>
                                        <TableCell>{b.sales}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default WlDetailsPanel;