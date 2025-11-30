import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select imports
import { Plus, BarChart3, List, RefreshCw } from 'lucide-react';
import { WLSalesEntry, Platform } from '@/data/trackingData';
import WLSalesChartPanel from './WLSalesChartPanel';
import WLSalesTablePanel from './WLSalesTablePanel';
import AddWLSalesForm from './AddWLSalesForm';
import { toast } from 'sonner';

interface WLSalesPanelThemedProps {
    wlSalesData: WLSalesEntry[];
    gameName: string;
    allPlatforms: Platform[];
    onAddDailyWLSalesEntry: (entry: { date: Date; platform: Platform; wishlists: number; sales: number }) => void;
    onDeleteEntry: (id: string) => void;
}

const WLSalesPanelThemed: React.FC<WLSalesPanelThemedProps> = ({
    wlSalesData,
    gameName,
    allPlatforms,
    onAddDailyWLSalesEntry,
    onDeleteEntry,
}) => {
    const [isAddDailyWLSalesFormOpen, setIsAddDailyWLSalesFormOpen] = useState(false);
    const [platformForDailyAdd, setPlatformForDailyAdd] = useState<Platform>('Steam');

    const handleAddDailyEntry = useCallback((data: { date: string; wishlists: number; sales: number; platform: Platform }) => {
        if (!data.date || data.wishlists === undefined || data.sales === undefined) {
            toast.error("Data, Wishlists e Vendas são obrigatórios.");
            return;
        }
        
        onAddDailyWLSalesEntry({
            date: new Date(data.date),
            platform: data.platform,
            wishlists: data.wishlists,
            sales: data.sales,
        });
        setIsAddDailyWLSalesFormOpen(false);
    }, [onAddDailyWLSalesEntry]);

    const platformsWithData = useMemo(() => {
        const platforms = new Set(wlSalesData.map(e => e.platform));
        return allPlatforms.filter(p => platforms.has(p) || p === platformForDailyAdd);
    }, [wlSalesData, allPlatforms, platformForDailyAdd]);

    return (
        <Card className="shadow-lg border-t-4 border-gogo-cyan">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl text-gogo-cyan">
                    <List className="h-5 w-5 mr-2 inline" /> Wishlists & Vendas ({gameName})
                </CardTitle>
                <div className="flex space-x-2">
                    <Dialog open={isAddDailyWLSalesFormOpen} onOpenChange={setIsAddDailyWLSalesFormOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Entrada
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Adicionar Entrada Diária de WL/Vendas</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm font-medium">Plataforma:</label>
                                    <Select value={platformForDailyAdd} onValueChange={(p) => setPlatformForDailyAdd(p as Platform)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Selecione a Plataforma" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allPlatforms.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <AddWLSalesForm
                                    wlSalesData={wlSalesData.filter(e => e.platform === platformForDailyAdd)}
                                    onSave={(data) => handleAddDailyEntry({ ...data, platform: platformForDailyAdd })}
                                    onClose={() => setIsAddDailyWLSalesFormOpen(false)}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="chart">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="chart" className="flex items-center"><BarChart3 className="h-4 w-4 mr-2" /> Gráfico</TabsTrigger>
                        <TabsTrigger value="table" className="flex items-center"><List className="h-4 w-4 mr-2" /> Tabela</TabsTrigger>
                    </TabsList>
                    <TabsContent value="chart" className="mt-4">
                        <WLSalesChartPanel wlSalesData={wlSalesData} gameName={gameName} />
                    </TabsContent>
                    <TabsContent value="table" className="mt-4">
                        <WLSalesTablePanel wlSalesData={wlSalesData} onDeleteEntry={onDeleteEntry} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default WLSalesPanelThemed;