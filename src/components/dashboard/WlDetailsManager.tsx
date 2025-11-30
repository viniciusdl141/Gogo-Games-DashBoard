import React, { useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatCurrency } from '@/lib/utils';
import {
    WlDetails,
    ReviewEntry,
    BundleEntry,
    Platform,
    PaidTrafficEntry,
    TrafficEntry,
    InfluencerTrackingEntry,
    EventTrackingEntry,
    DemoTrackingEntry,
    WLSalesEntry,
} from '@/data/trackingData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Edit, Plus, ChevronDown, ChevronUp, MessageSquare, Package, DollarSign, TrendingUp, Clock, List } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// --- Utility Functions ---

const generateLocalUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// --- Form Schemas ---

const AddReviewFormSchema = z.object({
    date: z.string().min(1, "Data é obrigatória."),
    platform: z.string().min(1, "Plataforma é obrigatória."),
    score: z.coerce.number().min(0).max(100, "Score deve ser entre 0 e 100."),
    summary: z.string().optional(),
});

const AddBundleFormSchema = z.object({
    name: z.string().min(1, "Nome do Bundle é obrigatório."),
    bundleUnits: z.coerce.number().min(0, "Unidades do Bundle devem ser >= 0."),
    packageUnits: z.coerce.number().min(0, "Unidades do Pacote devem ser >= 0."),
    salesUSD: z.coerce.number().min(0, "Vendas (USD) devem ser >= 0."),
    xsolla: z.string().optional(),
});

const AddTrafficFormSchema = z.object({
    date: z.string().min(1, "Data é obrigatória."),
    platform: z.string().min(1, "Plataforma é obrigatória."),
    source: z.string().min(1, "Fonte é obrigatória."),
    visits: z.coerce.number().min(0, "Visitas devem ser >= 0."),
    wishlists: z.coerce.number().min(0, "Wishlists devem ser >= 0."),
    sales: z.coerce.number().min(0, "Vendas devem ser >= 0."),
});

// --- Form Components ---

interface AddReviewFormProps {
    onSave: (review: Omit<ReviewEntry, 'id' | 'game'>) => void;
    onClose: () => void;
}

const AddReviewForm: React.FC<AddReviewFormProps> = ({ onSave, onClose }) => {
    const form = useForm<z.infer<typeof AddReviewFormSchema>>({
        resolver: zodResolver(AddReviewFormSchema),
        defaultValues: {
            date: new Date().toISOString().substring(0, 10),
            platform: 'Steam',
            score: 0,
            summary: '',
        },
    });

    const onSubmit = (values: z.infer<typeof AddReviewFormSchema>) => {
        onSave({
            date: new Date(values.date),
            platform: values.platform as Platform,
            score: values.score,
            summary: values.summary || '',
        });
        onClose();
        toast.success("Review adicionada com sucesso.");
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="platform"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Plataforma</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a plataforma" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Epic Games', 'Outra'].map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Score (0-100)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Resumo/Comentário</FormLabel>
                            <FormControl>
                                <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Review</Button>
                </div>
            </form>
        </Form>
    );
};

interface AddBundleFormProps {
    onSave: (bundle: BundleEntry) => void;
    onClose: () => void;
}

const AddBundleForm: React.FC<AddBundleFormProps> = ({ onSave, onClose }) => {
    const form = useForm<z.infer<typeof AddBundleFormSchema>>({
        resolver: zodResolver(AddBundleFormSchema),
        defaultValues: {
            name: '',
            bundleUnits: 0,
            packageUnits: 0,
            salesUSD: 0,
            xsolla: '',
        },
    });

    const onSubmit = (values: z.infer<typeof AddBundleFormSchema>) => {
        const newBundleEntry: BundleEntry = {
            id: generateLocalUniqueId('bundle'),
            name: values.name,
            bundleUnits: values.bundleUnits,
            packageUnits: values.packageUnits,
            sales: formatCurrency(values.salesUSD, 'USD'), // Store formatted string
            xsolla: values.xsolla || '-',
        };
        onSave(newBundleEntry);
        onClose();
        toast.success("Bundle adicionado com sucesso.");
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Bundle</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bundleUnits"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Unidades do Bundle</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="packageUnits"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Unidades do Pacote</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="salesUSD"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vendas (USD)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="xsolla"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Xsolla (Opcional)</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Bundle</Button>
                </div>
            </form>
        </Form>
    );
};

interface AddTrafficFormProps {
    gameName: string;
    onAddTraffic: (traffic: Omit<TrafficEntry, 'id'>) => void;
    onClose: () => void;
}

const AddTrafficForm: React.FC<AddTrafficFormProps> = ({ gameName, onAddTraffic, onClose }) => {
    const form = useForm<z.infer<typeof AddTrafficFormSchema>>({
        resolver: zodResolver(AddTrafficFormSchema),
        defaultValues: {
            date: new Date().toISOString().substring(0, 10),
            platform: 'Steam',
            source: '',
            visits: 0,
            wishlists: 0,
            sales: 0,
        },
    });

    const onSubmit = (values: z.infer<typeof AddTrafficFormSchema>) => {
        // Ensure the game name is correctly set, even if the form allows selection
        const newTrafficEntry: Omit<TrafficEntry, 'id'> = {
            date: new Date(values.date),
            source: values.source,
            visits: values.visits,
            wishlists: values.wishlists,
            sales: values.sales,
            game: gameName, 
            platform: values.platform as Platform 
        };
        onAddTraffic(newTrafficEntry);
        onClose();
        toast.success("Entrada de Tráfego adicionada com sucesso.");
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="platform"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Plataforma</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a plataforma" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {['Steam', 'Xbox', 'Playstation', 'Nintendo', 'Epic Games', 'Outra'].map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fonte de Tráfego</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="visits"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Visitas</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="wishlists"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Wishlists</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="sales"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vendas</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Tráfego</Button>
                </div>
            </form>
        </Form>
    );
};

// --- Main Component ---

interface WlDetailsManagerProps {
    wlDetails: WlDetails | undefined;
    gameName: string;
    onUpdateWlDetails: (updatedDetails: WlDetails) => void;
    onAddTraffic: (traffic: Omit<TrafficEntry, 'id'>) => void;
}

const WlDetailsManager: React.FC<WlDetailsManagerProps> = ({ wlDetails, gameName, onUpdateWlDetails, onAddTraffic }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isBundleDialogOpen, setIsBundleDialogOpen] = useState(false);
    const [isTrafficDialogOpen, setIsTrafficDialogOpen] = useState(false);
    const [expandedSection, setExpandedSection] = useState<'reviews' | 'bundles' | 'traffic' | null>('reviews');

    const reviews = useMemo(() => wlDetails?.reviews || [], [wlDetails]);
    const bundles = useMemo(() => wlDetails?.bundles || [], [wlDetails]);

    const handleAddReview = useCallback((newReview: Omit<ReviewEntry, 'id' | 'game'>) => {
        if (!wlDetails) return;

        const reviewWithId: ReviewEntry = {
            ...newReview,
            id: generateLocalUniqueId('review'),
            game: gameName,
        };

        const updatedDetails: WlDetails = {
            ...wlDetails,
            reviews: [...wlDetails.reviews, reviewWithId],
        };
        onUpdateWlDetails(updatedDetails);
    }, [wlDetails, gameName, onUpdateWlDetails]);

    const handleDeleteReview = useCallback((reviewId: string) => {
        if (!wlDetails) return;
        const updatedDetails: WlDetails = {
            ...wlDetails,
            reviews: wlDetails.reviews.filter(r => r.id !== reviewId),
        };
        onUpdateWlDetails(updatedDetails);
        toast.success("Review removida.");
    }, [wlDetails, onUpdateWlDetails]);

    const handleSaveBundle = (values: z.infer<typeof AddBundleFormSchema>) => {
        if (!wlDetails) return;

        const newBundleEntry: BundleEntry = {
            id: generateLocalUniqueId('bundle'),
            name: values.name,
            bundleUnits: values.bundleUnits,
            packageUnits: values.packageUnits,
            sales: formatCurrency(values.salesUSD, 'USD'), // Store formatted string
            xsolla: values.xsolla || '-',
        };

        const updatedDetails: WlDetails = {
            ...wlDetails,
            bundles: [...wlDetails.bundles, newBundleEntry],
        };
        onUpdateWlDetails(updatedDetails);
        setIsBundleDialogOpen(false);
    };

    const handleDeleteBundle = useCallback((bundleId: string) => {
        if (!wlDetails) return;
        const updatedDetails: WlDetails = {
            ...wlDetails,
            bundles: wlDetails.bundles.filter(b => b.id !== bundleId),
        };
        onUpdateWlDetails(updatedDetails);
        toast.success("Bundle removido.");
    }, [wlDetails, onUpdateWlDetails]);

    const handleSaveTraffic = (values: z.infer<typeof AddTrafficFormSchema>) => {
        // Ensure the game name is correctly set, even if the form allows selection
        const newTrafficEntry: Omit<TrafficEntry, 'id'> = {
            date: new Date(values.date),
            source: values.source,
            visits: values.visits,
            wishlists: values.wishlists,
            sales: values.sales,
            game: gameName, 
            platform: values.platform as Platform 
        };
        onAddTraffic(newTrafficEntry);
        setIsTrafficDialogOpen(false);
    };

    const toggleSection = (section: 'reviews' | 'bundles' | 'traffic') => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const renderSectionHeader = (title: string, section: 'reviews' | 'bundles' | 'traffic', dialogTrigger: React.ReactNode) => (
        <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => toggleSection(section)}>
            <h3 className="text-lg font-semibold flex items-center">
                {title}
                <span className="ml-2 text-sm text-gray-500">({section === 'reviews' ? reviews.length : bundles.length})</span>
            </h3>
            <div className="flex items-center space-x-2">
                {dialogTrigger}
                {expandedSection === section ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
        </div>
    );

    const renderReviews = () => (
        <div className="p-4 pt-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead className="w-[100px]">Plataforma</TableHead>
                        <TableHead className="w-[80px]">Score</TableHead>
                        <TableHead>Resumo</TableHead>
                        <TableHead className="w-[50px] text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reviews.length > 0 ? (
                        reviews.map((review) => (
                            <TableRow key={review.id}>
                                <TableCell>{formatDate(review.date)}</TableCell>
                                <TableCell>{review.platform}</TableCell>
                                <TableCell className="font-medium">{review.score}%</TableCell>
                                <TableCell className="text-sm text-gray-600">{review.summary || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteReview(review.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                Nenhuma review adicionada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    const renderBundles = () => (
        <div className="p-4 pt-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Unidades Bundle</TableHead>
                        <TableHead className="text-right">Unidades Pacote</TableHead>
                        <TableHead className="text-right">Vendas (USD)</TableHead>
                        <TableHead>Xsolla</TableHead>
                        <TableHead className="w-[50px] text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bundles.length > 0 ? (
                        bundles.map((bundle) => (
                            <TableRow key={bundle.id}>
                                <TableCell className="font-medium">{bundle.name}</TableCell>
                                <TableCell className="text-right">{bundle.bundleUnits}</TableCell>
                                <TableCell className="text-right">{bundle.packageUnits}</TableCell>
                                <TableCell className="text-right font-semibold text-gogo-green">{bundle.sales}</TableCell>
                                <TableCell>{bundle.xsolla}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBundle(bundle.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                Nenhum bundle adicionado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    const renderTraffic = () => (
        <div className="p-4 pt-0">
            <p className="text-sm text-gray-500">
                O tráfego é gerenciado no painel de Tráfego Geral. Use o botão abaixo para adicionar uma entrada de tráfego manual.
            </p>
            <Dialog open={isTrafficDialogOpen} onOpenChange={setIsTrafficDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Entrada de Tráfego
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Entrada de Tráfego Manual</DialogTitle>
                    </DialogHeader>
                    <AddTrafficForm gameName={gameName} onAddTraffic={handleSaveTraffic} onClose={() => setIsTrafficDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl flex items-center">
                    <List className="h-5 w-5 mr-2 text-gogo-cyan" /> Detalhes Adicionais do Wishlist
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {/* Reviews Section */}
                <div className="border-b">
                    {renderSectionHeader(
                        "Reviews e Notas",
                        'reviews',
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true); }}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Adicionar Nova Review</DialogTitle>
                                </DialogHeader>
                                <AddReviewForm onSave={handleAddReview} onClose={() => setIsDialogOpen(false)} />
                            </DialogContent>
                        </Dialog>
                    )}
                    {expandedSection === 'reviews' && renderReviews()}
                </div>

                {/* Bundles Section */}
                <div className="border-b">
                    {renderSectionHeader(
                        "Bundles e Pacotes",
                        'bundles',
                        <Dialog open={isBundleDialogOpen} onOpenChange={setIsBundleDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsBundleDialogOpen(true); }}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Adicionar Novo Bundle</DialogTitle>
                                </DialogHeader>
                                <AddBundleForm onSave={handleSaveBundle} onClose={() => setIsBundleDialogOpen(false)} />
                            </DialogContent>
                        </Dialog>
                    )}
                    {expandedSection === 'bundles' && renderBundles()}
                </div>

                {/* Traffic Section */}
                <div>
                    {renderSectionHeader(
                        "Tráfego Manual",
                        'traffic',
                        null // Traffic dialog is rendered inside the section content
                    )}
                    {expandedSection === 'traffic' && renderTraffic()}
                </div>
            </CardContent>
        </Card>
    );
};

export default WlDetailsManager;