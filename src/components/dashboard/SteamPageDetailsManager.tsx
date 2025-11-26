"use client";

import React, { useState } from 'react';
import { WlDetails, Platform, DemoTrackingEntry } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Package, Globe, Clock, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WlDetailsManager from './WlDetailsManager';
import AddBundleForm from './AddBundleForm';
import AddTrafficForm from './AddTrafficForm';
import AddDemoForm from './AddDemoForm';
import DemoTrackingPanel from './DemoTrackingPanel';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

// Schema for AddReviewForm (copied from WlDetailsManager for local use)
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
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold">Adicionar Análise de Review</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
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
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Classificação" />
                                        </SelectTrigger>
                                    </FormControl>
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
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
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
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
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
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
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
        </Form>
    );
};


interface SteamPageDetailsManagerProps {
    gameName: string;
    wlDetails: WlDetails | undefined;
    demoTracking: DemoTrackingEntry[];
    allGames: string[];
    onUpdateWlDetails: (game: string, newDetails: Partial<WlDetails>) => void;
    onAddTraffic: (data: { game: string, platform: Platform, source: string, startDate: string, endDate: string, visits: number, impressions?: number, clicks?: number }) => void;
    onAddDemo: (data: Omit<DemoTrackingEntry, 'id' | 'date'> & { date: string }) => void;
    onEditDemo: (entry: DemoTrackingEntry) => void;
    onDeleteDemo: (id: string) => void;
}

const SteamPageDetailsManager: React.FC<SteamPageDetailsManagerProps> = ({
    gameName,
    wlDetails,
    demoTracking,
    allGames,
    onUpdateWlDetails,
    onAddTraffic,
    onAddDemo,
    onEditDemo,
    onDeleteDemo,
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formType, setFormType] = useState<'review' | 'bundle' | 'traffic' | 'demo'>('review');
    const [editingDemoEntry, setEditingDemoEntry] = useState<DemoTrackingEntry | null>(null);

    // Helper to generate unique IDs locally (since we are adding new entries)
    const generateLocalUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const handleSaveReview = (values: ReviewFormValues) => {
        const dateObject = new Date(values.date);
        const totalReviews = values.reviews;
        const positiveReviews = values.positive;
        const percentage = totalReviews > 0 ? positiveReviews / totalReviews : 0;

        const newReviewEntry = {
            id: generateLocalUniqueId('review'),
            reviews: totalReviews,
            positive: positiveReviews,
            negative: values.negative,
            percentage: percentage,
            rating: values.rating,
            date: dateObject,
        };

        const currentReviews = wlDetails?.reviews || [];
        onUpdateWlDetails(gameName, {
            reviews: [...currentReviews, newReviewEntry].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
        });
        toast.success("Nova análise de review adicionada.");
    };

    const handleSaveBundle = (values: any) => {
        const newBundleEntry = {
            id: generateLocalUniqueId('bundle'),
            name: values.name,
            bundleUnits: values.bundleUnits,
            packageUnits: values.packageUnits,
            sales: `$${values.salesUSD.toFixed(2)}`,
            xsolla: values.xsolla || '-',
        };

        const currentBundles = wlDetails?.bundles || [];
        onUpdateWlDetails(gameName, {
            bundles: [...currentBundles, newBundleEntry]
        });
        toast.success("Nova entrada de Bundle/DLC adicionada.");
    };
    
    const handleSaveTraffic = (values: any) => {
        onAddTraffic({ ...values, game: gameName, platform: values.platform as Platform });
        setIsDialogOpen(false);
    };
    
    const handleSaveDemo = (values: any) => {
        onAddDemo(values);
        setIsDialogOpen(false);
    };
    
    const handleEditDemoClick = (entry: DemoTrackingEntry) => {
        setEditingDemoEntry(entry);
    };
    
    const handleEditDemoSave = (entry: DemoTrackingEntry) => {
        onEditDemo(entry);
        setEditingDemoEntry(null);
    };

    const renderForm = () => {
        switch (formType) {
            case 'review':
                return <AddReviewForm gameName={gameName} onSave={handleSaveReview} onClose={() => setIsDialogOpen(false)} />;
            case 'bundle':
                return <AddBundleForm gameName={gameName} onSave={handleSaveBundle} onClose={() => setIsDialogOpen(false)} />;
            case 'traffic':
                return <AddTrafficForm games={[gameName]} onSave={handleSaveTraffic} onClose={() => setIsDialogOpen(false)} />;
            case 'demo':
                return <AddDemoForm gameName={gameName} onSave={handleSaveDemo} onClose={() => setIsDialogOpen(false)} />;
            default:
                return null;
        }
    };

    const hasDetails = wlDetails && (wlDetails.reviews.length > 0 || wlDetails.bundles.length > 0 || wlDetails.traffic.length > 0);

    return (
        <div className="space-y-6">
            {/* --- Painel de Detalhes da Steam (Reviews, Bundles, Traffic) --- */}
            {hasDetails ? (
                <WlDetailsManager 
                    details={wlDetails!} 
                    gameName={gameName}
                    allGames={allGames} 
                    onUpdateDetails={onUpdateWlDetails}
                    onAddTraffic={onAddTraffic}
                />
            ) : (
                <Card className="min-h-[200px] flex flex-col items-center justify-center border-dashed border-2 border-border">
                    <CardHeader>
                        <CardTitle className="text-xl text-gogo-orange">Detalhes da Página Steam</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-4">Nenhum dado de Reviews, Bundles ou Tráfego manual encontrado. Comece a adicionar:</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => { setFormType('review'); setIsDialogOpen(true); }}
                                className="text-gogo-cyan border-gogo-cyan hover:bg-gogo-cyan/10"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Review
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => { setFormType('bundle'); setIsDialogOpen(true); }}
                                className="text-gogo-cyan border-gogo-cyan hover:bg-gogo-cyan/10"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Bundle/DLC
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => { setFormType('traffic'); setIsDialogOpen(true); }}
                                className="text-gogo-cyan border-gogo-cyan hover:bg-gogo-cyan/10"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Tráfego Manual
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- Painel de Tracking da Demo --- */}
            <DemoTrackingPanel 
                data={demoTracking} 
                onDeleteTracking={onDeleteDemo} 
                onEditTracking={handleEditDemoClick}
            />
            
            <div className="flex justify-end mb-4 space-x-2">
                <Button 
                    onClick={() => { setFormType('demo'); setIsDialogOpen(true); }} 
                    className="bg-gogo-orange hover:bg-gogo-orange/90 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Demo Tracking
                </Button>
            </div>

            {/* Modal de Adição (Reviews, Bundle, Traffic, Demo) */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            {formType === 'review' && <MessageSquare className="h-5 w-5 mr-2" />}
                            {formType === 'bundle' && <Package className="h-5 w-5 mr-2" />}
                            {formType === 'traffic' && <Globe className="h-5 w-5 mr-2" />}
                            {formType === 'demo' && <Clock className="h-5 w-5 mr-2" />}
                            Adicionar {formType === 'review' ? 'Review' : formType === 'bundle' ? 'Bundle/DLC' : formType === 'traffic' ? 'Tráfego' : 'Demo Tracking'}
                        </DialogTitle>
                    </DialogHeader>
                    {renderForm()}
                </DialogContent>
            </Dialog>
            
            {/* Modal de Edição de Demo (separado para evitar conflito de estado) */}
            <Dialog open={!!editingDemoEntry} onOpenChange={(open) => !open && setEditingDemoEntry(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <Edit className="h-5 w-5 mr-2" /> Editar Entrada de Demo Tracking
                        </DialogTitle>
                    </DialogHeader>
                    {editingDemoEntry && (
                        <EditDemoForm 
                            entry={editingDemoEntry}
                            onSave={handleEditDemoSave}
                            onClose={() => setEditingDemoEntry(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SteamPageDetailsManager;