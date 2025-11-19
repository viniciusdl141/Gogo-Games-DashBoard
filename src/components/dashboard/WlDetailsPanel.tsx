"use client";

import React from 'react';
import { WlDetails } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from '@/lib/utils';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface WlDetailsPanelProps {
    details: WlDetails | undefined;
}

const ReviewTable: React.FC<{ reviews: any[] }> = ({ reviews }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Positivas</TableHead>
                <TableHead className="text-center">Negativas</TableHead>
                <TableHead className="text-center">% Positivas</TableHead>
                <TableHead>Classificação Steam</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {reviews.map((r, i) => (
                <TableRow key={i}>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell className="text-center">{r.reviews}</TableCell>
                    <TableCell className="text-center">{r.positive}</TableCell>
                    <TableCell className="text-center">{r.negative}</TableCell>
                    <TableCell className="text-center">{`${(Number(r.percentage) * 100).toFixed(0)}%`}</TableCell>
                    <TableCell>{r.rating}</TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const BundleTable: React.FC<{ bundles: any[] }> = ({ bundles }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Nome do Bundle/DLC</TableHead>
                <TableHead className="text-right">Unidades Bundle</TableHead>
                <TableHead className="text-right">Unidades Package</TableHead>
                <TableHead className="text-right">Vendas ($)</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {bundles.map((b, i) => (
                <TableRow key={i}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell className="text-right">{b.bundleUnits}</TableCell>
                    <TableCell className="text-right">{b.packageUnits}</TableCell>
                    <TableCell className="text-right">{b.sales}</TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const WlDetailsPanel: React.FC<WlDetailsPanelProps> = ({ details }) => {
    if (!details || (details.reviews.length === 0 && details.bundles.length === 0 && details.traffic.length === 0)) {
        return null; // Don't render if there's no extra data
    }

    const latestReview = details.reviews.length > 0 ? details.reviews[details.reviews.length - 1] : null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Detalhes Adicionais da Página Steam</CardTitle>
                {/* Placeholder for future Edit button */}
                <Button variant="outline" size="sm" disabled>
                    <Edit className="h-4 w-4 mr-2" /> Editar Detalhes
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {latestReview && (
                    <div className="mb-4 p-4 border rounded-md bg-muted/50">
                        <h3 className="text-md font-semibold mb-2">Última Análise de Reviews ({formatDate(latestReview.date)})</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <Badge className="bg-gogo-cyan hover:bg-gogo-cyan/90 text-white">{latestReview.rating}</Badge>
                            <p>Total: <span className="font-medium">{latestReview.reviews}</span></p>
                            <p>Positivas: <span className="font-medium text-green-600">{latestReview.positive}</span></p>
                            <p>Negativas: <span className="font-medium text-red-600">{latestReview.negative}</span></p>
                        </div>
                    </div>
                )}

                <Accordion type="multiple" className="w-full">
                    {details.reviews.length > 0 && (
                        <AccordionItem value="reviews">
                            <AccordionTrigger className="font-semibold">Histórico Completo de Reviews ({details.reviews.length} entradas)</AccordionTrigger>
                            <AccordionContent>
                                <div className="overflow-x-auto">
                                    <ReviewTable reviews={details.reviews} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {details.bundles.length > 0 && (
                        <AccordionItem value="bundles">
                            <AccordionTrigger className="font-semibold">Vendas de Bundles & DLCs ({details.bundles.length} entradas)</AccordionTrigger>
                            <AccordionContent>
                                <div className="overflow-x-auto">
                                    <BundleTable bundles={details.bundles} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </CardContent>
        </Card>
    );
};

export default WlDetailsPanel;