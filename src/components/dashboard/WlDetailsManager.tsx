"use client";

import React, { useState, useCallback } from 'react';
import { WlDetails, ReviewEntry, BundleEntry, TrafficEntry, Platform } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Package, TrendingUp, Clock, Globe } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber } from '@/lib/utils';
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
import { toast } from 'sonner';
import AddBundleForm, { AddBundleFormSchema } from './AddBundleForm'; 
import AddTrafficForm, { AddTrafficFormSchema } from './AddTrafficForm'; 
import * as z from 'zod'; 

// Helper to generate unique IDs locally
let localIdCounter = 0;
const generateLocalUniqueId = (prefix: string = 'track') => `${prefix}-${localIdCounter++}`;

// Definindo o tipo de dados que o AddTrafficFormSchema produz
type AddTrafficFormOutput = z.infer<typeof AddTrafficFormSchema>;

interface WlDetailsManagerProps {
    details: WlDetails;
    gameName: string;
    allGames: string[];
    onUpdateDetails: (game: string, newDetails: Partial<WlDetails>) => void;
    // Tipagem corrigida para aceitar o output completo do formulário + gameName
    onAddTraffic: (newEntry: AddTrafficFormOutput & { game: string, platform: Platform }) => void;
}

const ReviewTable: React.FC<{ reviews: ReviewEntry[] }> = ({ reviews }) => {
    if (reviews.length === 0) return <p className="text-muted-foreground p-4">Nenhum dado de reviews disponível.</p>;

    const sortedReviews = [...reviews].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Total Reviews</TableHead>
                        <TableHead className="text-right">Positivos</TableHead>
                        <TableHead className="text-right">Negativos</TableHead>
                        <TableHead className="text-right">% Positivos</TableHead>
                        <TableHead>Rating</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedReviews.map((review, index) => (
                        <TableRow key={index}>
                            <TableCell>{formatDate(review.date)}</TableCell>
                            <TableCell className="text-right">{formatNumber(review.reviews)}</TableCell>
                            <TableCell className="text-right text-green-500">{formatNumber(review.positive)}</TableCell>
                            <TableCell className="text-right text-red-500">{formatNumber(review.negative)}</TableCell>
                            <TableCell className="text-right font-medium">{review.percentage}</TableCell>
                            <TableCell>{review.rating}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const BundleTable: React.FC<{ bundles: BundleEntry[], onDelete: (id: string) => void }> = ({ bundles, onDelete }) => {
    if (bundles.length === 0) return <p className="text-muted-foreground p-4">Nenhum dado de bundles disponível.</p>;

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome do Bundle</TableHead>
                        <TableHead className="text-right">Unidades Bundle</TableHead>
                        <TableHead className="text-right">Unidades Pacote</TableHead>
                        <TableHead className="text-right">Vendas (USD)</TableHead>
                        <TableHead className="text-right">Xsolla</TableHead>
                        <TableHead className="w-[50px] text-center">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bundles.map((bundle) => (
                        <TableRow key={bundle.id}>
                            <TableCell className="font-medium">{bundle.name}</TableCell>
                            <TableCell className="text-right">{formatNumber(bundle.bundleUnits)}</TableCell>
                            <TableCell className="text-right">{formatNumber(bundle.packageUnits)}</TableCell>
                            <TableCell className="text-right font-medium text-green-500">{bundle.sales}</TableCell>
                            <TableCell className="text-right">{bundle.xsolla}</TableCell>
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
                                                Esta ação removerá permanentemente o registro do bundle "{bundle.name}".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDelete(bundle.id)} className="bg-destructive hover:bg-destructive/90">
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
};

const TrafficTable: React.FC<{ traffic: TrafficEntry[] }> = ({ traffic }) => {
    if (traffic.length === 0) return <p className="text-muted-foreground p-4">Nenhum dado de tráfego manual disponível.</p>;

    const sortedTraffic = [...traffic].sort((a, b) => (b.startDate?.getTime() || 0) - (a.startDate?.getTime() || 0));

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fonte</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Visitas</TableHead>
                        <TableHead className="text-right">Impressões</TableHead>
                        <TableHead className="text-right">Cliques</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTraffic.map((entry) => (
                        <TableRow key={entry.id}>
                            <TableCell className="font-medium">{entry.source}</TableCell>
                            <TableCell>{entry.platform}</TableCell>
                            <TableCell>{formatDate(entry.startDate)} - {formatDate(entry.endDate)}</TableCell>
                            <TableCell className="text-right">{formatNumber(entry.visits)}</TableCell>
                            <TableCell className="text-right">{formatNumber(entry.impressions)}</TableCell>
                            <TableCell className="text-right">{formatNumber(entry.clicks)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};


const WlDetailsManager: React.FC<WlDetailsManagerProps> = ({ details, gameName, onUpdateDetails, onAddTraffic }) => {
    const [isBundleDialogOpen, setIsBundleDialogOpen] = useState(false);
    const [isTrafficDialogOpen, setIsTrafficDialogOpen] = useState(false);

    const handleDeleteBundle = useCallback((id: string) => {
        const updatedBundles = details.bundles.filter(b => b.id !== id);
        onUpdateDetails(gameName, { bundles: updatedBundles });
        toast.success("Bundle removido.");
    }, [details.bundles, gameName, onUpdateDetails]);

    const handleSaveBundle = (values: z.infer<typeof AddBundleFormSchema>) => { 
        const newBundleEntry: BundleEntry = {
            id: generateLocalUniqueId('bundle'),
            name: values.name, 
            bundleUnits: values.bundleUnits, 
            packageUnits: values.packageUnits, 
            sales: `$${values.salesUSD.toFixed(2)}`, 
            xsolla: values.xsolla || '-', 
        };
        
        const updatedBundles = [...details.bundles, newBundleEntry];
        onUpdateDetails(gameName, { bundles: updatedBundles });
        setIsBundleDialogOpen(false);
    };

    const handleSaveTraffic = (values: AddTrafficFormOutput) => { 
        // O tipo AddTrafficFormOutput já garante que todos os campos obrigatórios (incluindo source, visits, impressions, clicks) estão presentes.
        onAddTraffic({ 
            ...values, 
            game: gameName, 
            platform: values.platform, 
            startDate: values.startDate,
            endDate: values.endDate,
        }); 
        setIsTrafficDialogOpen(false);
    };

    return (
        <div className="space-y-6">
            <Card className="ps-card-glow bg-card/50 backdrop-blur-sm border-ps-blue/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl flex items-center text-ps-blue">
                        <TrendingUp className="h-5 w-5 mr-2" /> Dados de Conversão e Vendas
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    {/* --- Reviews --- */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold flex items-center text-ps-light border-b border-border pb-1">
                            <Clock className="h-4 w-4 mr-2" /> Histórico de Reviews (Steam)
                        </h3>
                        <ReviewTable reviews={details.reviews} />
                    </div>

                    {/* --- Bundles --- */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-border pb-1">
                            <h3 className="text-lg font-semibold flex items-center text-ps-light">
                                <Package className="h-4 w-4 mr-2" /> Vendas de Bundles
                            </h3>
                            <Dialog open={isBundleDialogOpen} onOpenChange={setIsBundleDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-ps-light border-ps-blue hover:bg-ps-blue/20">
                                        <Plus className="h-4 w-4 mr-2" /> Adicionar Bundle
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-ps-blue">
                                    <DialogHeader>
                                        <DialogTitle className="text-ps-blue">Adicionar Novo Bundle</DialogTitle>
                                    </DialogHeader>
                                    <AddBundleForm 
                                        onSave={handleSaveBundle} 
                                        onClose={() => setIsBundleDialogOpen(false)} 
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <BundleTable bundles={details.bundles} onDelete={handleDeleteBundle} />
                    </div>

                    {/* --- Traffic --- */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-border pb-1">
                            <h3 className="text-lg font-semibold flex items-center text-ps-light">
                                <Globe className="h-4 w-4 mr-2" /> Tráfego Manual (Visitas/Impressões)
                            </h3>
                            <Dialog open={isTrafficDialogOpen} onOpenChange={setIsTrafficDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-ps-light border-ps-blue hover:bg-ps-blue/20">
                                        <Plus className="h-4 w-4 mr-2" /> Adicionar Tráfego
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-ps-blue">
                                    <DialogHeader>
                                        <DialogTitle className="text-ps-blue">Adicionar Entrada de Tráfego</DialogTitle>
                                    </DialogHeader>
                                    <AddTrafficForm 
                                        gameName={gameName}
                                        onSave={handleSaveTraffic} 
                                        onClose={() => setIsTrafficDialogOpen(false)} 
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <TrafficTable traffic={details.traffic as TrafficEntry[]} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default WlDetailsManager;