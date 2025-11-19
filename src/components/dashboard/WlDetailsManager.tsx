"use client";

import React, { useState } from 'react';
import { WlDetails, ReviewEntry, BundleEntry } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatCurrency } from '@/lib/utils';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, MessageSquare, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
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
import AddBundleForm from './AddBundleForm'; // Novo Import

// --- Forms for adding new entries (moved AddReviewForm here for encapsulation) ---

const ReviewSchema = z.object({
    date: z.string().min(1),
    reviews: z.number().min(0),
    positive: z.number().min(0),
    negative: z.number().min(0),
    rating: z.string().min(1),
});

type ReviewFormValues = z.infer<typeof ReviewSchema>;

const AddReviewForm: React.FC<{ gameName: string, onSave: (data: ReviewFormValues) => void, onClose: () => void }> = ({ gameName, onSave, onClose }) => {
    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(ReviewSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            reviews: 0,
            positive: 0,
            negative: 0,
            rating: 'Neutras',
        },
    });

    const onSubmit = (values: ReviewFormValues) => {
        onSave(values);
        onClose();
    };

    const ratings = ['Muito Positivas', 'Positivas', 'Neutras', 'Negativas', 'Muito Negativas'];

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
            <h3 className="text-lg font-semibold">Adicionar Análise de Review</h3>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data</FormLabel>
                            <Input type="date" {...field} />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Classificação Steam</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Classificação" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ratings.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="reviews"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Total Reviews</FormLabel>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="positive"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Positivas</FormLabel>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="negative"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Negativas</FormLabel>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" className="bg-gogo-cyan hover:bg-gogo-cyan/90">Salvar Review</Button>
            </div>
        </form>
    );
};


// --- Display Components ---

const ReviewTable: React.FC<{ reviews: ReviewEntry[], onDelete: (id: string) => void }> = ({ reviews, onDelete }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Positivas</TableHead>
                <TableHead className="text-center">Negativas</TableHead>
                <TableHead className="text-center">% Positivas</TableHead>
                <TableHead>Classificação Steam</TableHead>
                <TableHead className="w-[50px] text-center">Ações</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {reviews.map((r, i) => (
                <TableRow key={r.id || i}>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell className="text-center">{r.reviews}</TableCell>
                    <TableCell className="text-center">{r.positive}</TableCell>
                    <TableCell className="text-center">{r.negative}</TableCell>
                    <TableCell className="text-center">{`${(Number(r.percentage) * 100).toFixed(0)}%`}</TableCell>
                    <TableCell>{r.rating}</TableCell>
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
                                        Esta ação removerá permanentemente esta entrada de review da data {formatDate(r.date)}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(r.id)} className="bg-destructive hover:bg-destructive/90">
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
);

const BundleTable: React.FC<{ bundles: BundleEntry[], onDelete: (id: string) => void }> = ({ bundles, onDelete }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Nome do Bundle/DLC</TableHead>
                <TableHead className="text-right">Unidades Bundle</TableHead>
                <TableHead className="text-right">Unidades Package</TableHead>
                <TableHead className="text-right">Vendas ($)</TableHead>
                <TableHead className="w-[50px] text-center">Ações</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {bundles.map((b, i) => (
                <TableRow key={b.id || i}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell className="text-right">{b.bundleUnits}</TableCell>
                    <TableCell className="text-right">{b.packageUnits}</TableCell>
                    <TableCell className="text-right">{b.sales}</TableCell>
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
                                        Esta ação removerá permanentemente o registro do Bundle/DLC "{b.name}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(b.id)} className="bg-destructive hover:bg-destructive/90">
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
);

// --- Main Manager Component ---

const WlDetailsManager: React.FC<WlDetailsManagerProps> = ({ details, gameName, onUpdateDetails }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formType, setFormType] = useState<'review' | 'bundle'>('review');

    if (!details) return null;

    const latestReview = details.reviews.length > 0 ? details.reviews[details.reviews.length - 1] : null;

    // Helper to generate unique IDs locally (since we are adding new entries)
    const generateLocalUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const handleSaveReview = (values: ReviewFormValues) => {
        const dateObject = new Date(values.date);
        const totalReviews = values.reviews;
        const positiveReviews = values.positive;
        const percentage = totalReviews > 0 ? positiveReviews / totalReviews : 0;

        const newReviewEntry: ReviewEntry = {
            id: generateLocalUniqueId('review'),
            reviews: totalReviews,
            positive: positiveReviews,
            negative: values.negative,
            percentage: percentage,
            rating: values.rating,
            date: dateObject,
        };

        onUpdateDetails(gameName, {
            reviews: [...details.reviews, newReviewEntry].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
        });
        toast.success("Nova análise de review adicionada.");
    };

    const handleSaveBundle = (values: z.infer<typeof AddBundleForm>) => {
        const newBundleEntry: BundleEntry = {
            id: generateLocalUniqueId('bundle'),
            name: values.name,
            bundleUnits: values.bundleUnits,
            packageUnits: values.packageUnits,
            sales: `$${values.salesUSD.toFixed(2)}`,
            xsolla: values.xsolla || '-',
        };

        onUpdateDetails(gameName, {
            bundles: [...details.bundles, newBundleEntry]
        });
        toast.success("Nova entrada de Bundle/DLC adicionada.");
    };

    const handleDeleteReview = (id: string) => {
        onUpdateDetails(gameName, {
            reviews: details.reviews.filter(r => r.id !== id)
        });
        toast.success("Entrada de review removida.");
    };

    const handleDeleteBundle = (id: string) => {
        onUpdateDetails(gameName, {
            bundles: details.bundles.filter(b => b.id !== id)
        });
        toast.success("Entrada de bundle/DLC removida.");
    };

    const renderForm = () => {
        if (formType === 'review') {
            return <AddReviewForm gameName={gameName} onSave={handleSaveReview} onClose={() => setIsDialogOpen(false)} />;
        }
        if (formType === 'bundle') {
            return <AddBundleForm gameName={gameName} onSave={handleSaveBundle} onClose={() => setIsDialogOpen(false)} />;
        }
        return null;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Detalhes Adicionais da Página Steam</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-gogo-orange hover:bg-gogo-orange/90 text-white"
                            onClick={() => {
                                setFormType('review'); // Default to review when opening
                                setIsDialogOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Adicionar Detalhe
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Detalhe de WL</DialogTitle>
                        </DialogHeader>
                        <div className="p-4 space-y-4">
                            <Select value={formType} onValueChange={(value: 'review' | 'bundle') => setFormType(value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione o tipo de entrada" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="review">
                                        <MessageSquare className="h-4 w-4 inline mr-2" /> Análise de Reviews
                                    </SelectItem>
                                    <SelectItem value="bundle">
                                        <Package className="h-4 w-4 inline mr-2" /> Venda de Bundle/DLC
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {renderForm()}
                        </div>
                    </DialogContent>
                </Dialog>
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
                                    <ReviewTable reviews={details.reviews} onDelete={handleDeleteReview} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {details.bundles.length > 0 && (
                        <AccordionItem value="bundles">
                            <AccordionTrigger className="font-semibold">Vendas de Bundles & DLCs ({details.bundles.length} entradas)</AccordionTrigger>
                            <AccordionContent>
                                <div className="overflow-x-auto">
                                    <BundleTable bundles={details.bundles} onDelete={handleDeleteBundle} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </CardContent>
        </Card>
    );
};

export default WlDetailsManager;