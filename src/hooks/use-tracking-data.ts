"use client";

import { useState, useCallback } from 'react'; // Removed useMemo
import { 
    getTrackingData, 
    InfluencerTrackingEntry, 
    EventTrackingEntry, 
    PaidTrafficEntry, 
    DemoTrackingEntry, 
    WLSalesPlatformEntry, 
    ManualEventMarker, 
    TrafficEntry, 
    TrackingData, 
    recalculateWLSalesForPlatform,
    Platform,
    SaleType
} from '@/data/trackingData';
import { startOfDay } from 'date-fns';
import { toast } from 'sonner';
import * as z from 'zod';
import { DailyWLSalesFormSchema } from '@/components/dashboard/AddDailyWLSalesForm';
import { AddTrafficFormSchema } from '@/components/dashboard/AddTrafficForm';
import { convertToCSV } from '@/lib/utils'; // Added missing import

// Helper to generate unique IDs locally
let localIdCounter = getTrackingData().influencerTracking.length + getTrackingData().eventTracking.length + getTrackingData().paidTraffic.length + getTrackingData().wlSales.length + getTrackingData().demoTracking.length + getTrackingData().manualEventMarkers.length + getTrackingData().trafficTracking.length;
const generateLocalUniqueId = (prefix: string = 'track') => `${prefix}-${localIdCounter++}`;

type DailyWLSalesData = z.infer<typeof DailyWLSalesFormSchema>;
type AddTrafficFormOutput = z.infer<typeof AddTrafficFormSchema>;

export const useTrackingData = (selectedGameName: string) => {
    const [trackingData, setTrackingData] = useState(getTrackingData());

    // --- AI Data Processing Handler ---
    const handleAIDataProcessed = useCallback((structuredData: any) => {
        setTrackingData(prevData => {
            const gameName = selectedGameName;
            const newTrackingData = { ...prevData };

            // Helper to process arrays, convert dates, and assign IDs
            const processArray = (key: keyof TrackingData, prefix: string, data: any[]) => {
                if (!data) return;

                const processedData = data.map(item => {
                    const newItem = { ...item, id: generateLocalUniqueId(prefix), game: gameName };
                    
                    // Convert date strings back to Date objects
                    if (item.date && typeof item.date === 'string') {
                        newItem.date = startOfDay(new Date(item.date));
                    }
                    if (item.startDate && typeof item.startDate === 'string') {
                        newItem.startDate = startOfDay(new Date(item.startDate));
                    }
                    if (item.endDate && typeof item.endDate === 'string') {
                        newItem.endDate = startOfDay(new Date(item.endDate));
                    }
                    
                    return newItem;
                }).filter(item => item.game === gameName); // Ensure data belongs to the current game

                if (key === 'wlSales') {
                    const existingWLSalesForOtherGames = prevData.wlSales.filter(e => e.game !== gameName);
                    const existingWLSalesForCurrentGame = prevData.wlSales.filter(e => e.game === gameName);
                    
                    const updatedWLSalesForCurrentGame = [...existingWLSalesForCurrentGame, ...processedData];
                    const platformsAffected = new Set(processedData.map(d => d.platform || 'Steam'));
                    
                    let finalWLSales = [...existingWLSalesForOtherGames];
                    
                    platformsAffected.forEach(platform => {
                        const entriesForPlatform = updatedWLSalesForCurrentGame.filter(e => e.game === gameName && e.platform === platform);
                        const recalculated = recalculateWLSalesForPlatform(entriesForPlatform, gameName, platform as Platform);
                        finalWLSales = finalWLSales.filter(e => e.game !== gameName || e.platform !== platform).concat(recalculated);
                    });
                    
                    newTrackingData.wlSales = finalWLSales;
                } else {
                    const existingEntries = prevData[key].filter((e: any) => e.game !== gameName);
                    newTrackingData[key] = [...existingEntries, ...processedData];
                }
            };

            processArray('influencerTracking', 'ai-inf', structuredData.influencerTracking || []);
            processArray('eventTracking', 'ai-evt', structuredData.eventTracking || []);
            processArray('paidTraffic', 'ai-paid', structuredData.paidTraffic || []);
            processArray('wlSales', 'ai-wl', structuredData.wlSales || []);
            processArray('demoTracking', 'ai-demo', structuredData.demoTracking || []);
            processArray('trafficTracking', 'ai-traffic', structuredData.trafficTracking || []);
            processArray('manualEventMarkers', 'ai-marker', structuredData.manualEventMarkers || []);

            return newTrackingData;
        });
    }, [selectedGameName]);

    // --- WL/Sales Handlers ---
    const handleEditWLSalesEntry = useCallback((updatedEntry: WLSalesPlatformEntry) => {
        setTrackingData(prevData => {
            const updatedWLSales = prevData.wlSales.map(entry => 
                entry.id === updatedEntry.id ? updatedEntry : entry
            );
            const finalWLSales = recalculateWLSalesForPlatform(updatedWLSales, updatedEntry.game, updatedEntry.platform);
            return { ...prevData, wlSales: finalWLSales };
        });
    }, []);

    const handleAddWLSalesEntry = useCallback((newEntry: Omit<WLSalesPlatformEntry, 'date' | 'variation' | 'id'> & { date: string, saleType: SaleType, platform: Platform }) => {
        const dateObject = new Date(newEntry.date);
        const entryToAdd: WLSalesPlatformEntry = {
            ...newEntry,
            id: generateLocalUniqueId('wl'),
            date: dateObject,
            variation: 0,
        };
        const updatedWLSales = [...trackingData.wlSales, entryToAdd];
        const finalWLSales = recalculateWLSalesForPlatform(updatedWLSales, newEntry.game, newEntry.platform);
        setTrackingData(prevData => ({ ...prevData, wlSales: finalWLSales }));
    }, [trackingData.wlSales]);

    const handleAddDailyWLSalesEntry = useCallback((newEntry: DailyWLSalesData & { platform: Platform }) => {
        const dateObject = startOfDay(new Date(newEntry.date));
        const entryToAdd: WLSalesPlatformEntry = {
            id: generateLocalUniqueId('wl'),
            date: dateObject,
            game: selectedGameName,
            platform: newEntry.platform,
            wishlists: newEntry.wishlists,
            sales: newEntry.sales,
            variation: 0,
            saleType: 'Padrão', 
            frequency: 'Diário',
        };
        const updatedWLSales = [...trackingData.wlSales, entryToAdd];
        const finalWLSales = recalculateWLSalesForPlatform(updatedWLSales, selectedGameName, newEntry.platform);
        setTrackingData(prevData => ({ ...prevData, wlSales: finalWLSales }));
    }, [selectedGameName, trackingData.wlSales]);

    const handleDeleteWLSalesEntry = useCallback((id: string) => {
        setTrackingData(prevData => {
            const entryToDelete = prevData.wlSales.find(entry => entry.id === id);
            if (!entryToDelete) return prevData;
            const updatedWLSales = prevData.wlSales.filter(entry => entry.id !== id);
            const finalWLSales = recalculateWLSalesForPlatform(updatedWLSales, entryToDelete.game, entryToDelete.platform);
            return { ...prevData, wlSales: finalWLSales };
        });
        toast.success("Entrada de Wishlist/Vendas removida com sucesso.");
    }, []);

    // --- Manual Event Marker Handlers ---
    const handleSaveManualMarker = useCallback((values: { date: string, name: string }) => {
        const dateObject = startOfDay(new Date(values.date));
        const existingMarker = trackingData.manualEventMarkers.find(m => 
            m.game === selectedGameName && startOfDay(m.date).getTime() === dateObject.getTime()
        );

        if (existingMarker) {
            setTrackingData(prevData => ({
                ...prevData,
                manualEventMarkers: prevData.manualEventMarkers.map(m => 
                    m.id === existingMarker.id ? { ...m, name: values.name } : m
                ),
            }));
        } else {
            const newMarker: ManualEventMarker = {
                id: generateLocalUniqueId('manual-event'),
                game: selectedGameName,
                date: dateObject,
                name: values.name,
            };
            setTrackingData(prevData => ({
                ...prevData,
                manualEventMarkers: [...prevData.manualEventMarkers, newMarker],
            }));
        }
    }, [selectedGameName, trackingData.manualEventMarkers]);

    const handleDeleteManualMarker = useCallback((id: string) => {
        setTrackingData(prevData => ({
            ...prevData,
            manualEventMarkers: prevData.manualEventMarkers.filter(m => m.id !== id),
        }));
    }, []);

    // --- Influencer Handlers ---
    const handleEditInfluencerEntry = useCallback((updatedEntry: InfluencerTrackingEntry) => {
        setTrackingData(prevData => ({
            ...prevData,
            influencerTracking: prevData.influencerTracking.map(entry => 
                entry.id === updatedEntry.id ? updatedEntry : entry
            ).sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0)),
        }));
    }, []);

    const handleDeleteInfluencerEntry = useCallback((id: string) => {
        setTrackingData(prevData => ({
            ...prevData,
            influencerTracking: prevData.influencerTracking.filter(entry => entry.id !== id),
        }));
        toast.success("Entrada de influencer removida com sucesso.");
    }, []);

    const handleAddInfluencerEntry = useCallback((newEntry: Omit<InfluencerTrackingEntry, 'id' | 'roi' | 'date'> & { date: string }) => {
        const dateObject = new Date(newEntry.date);
        const roiValue = newEntry.estimatedWL > 0 ? newEntry.investment / newEntry.estimatedWL : '-';
        const entryToAdd: InfluencerTrackingEntry = {
            ...newEntry,
            id: generateLocalUniqueId('influencer'),
            date: dateObject,
            roi: roiValue,
        };
        setTrackingData(prevData => ({
            ...prevData,
            influencerTracking: [...prevData.influencerTracking, entryToAdd].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0)),
        }));
    }, []);

    // --- Event Handlers ---
    const handleEditEventEntry = useCallback((updatedEntry: EventTrackingEntry) => {
        setTrackingData(prevData => ({
            ...prevData,
            eventTracking: prevData.eventTracking.map(entry => 
                entry.id === updatedEntry.id ? updatedEntry : entry
            ).sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)),
        }));
    }, []);

    const handleDeleteEventEntry = useCallback((id: string) => {
        setTrackingData(prevData => ({
            ...prevData,
            eventTracking: prevData.eventTracking.filter(entry => entry.id !== id),
        }));
        toast.success("Entrada de evento removida com sucesso.");
    }, []);

    const handleAddEventEntry = useCallback((newEntry: Omit<EventTrackingEntry, 'startDate' | 'endDate' | 'roi' | 'costPerView' | 'id'> & { startDate: string, endDate: string }) => {
        const startDateObject = new Date(newEntry.startDate);
        const endDateObject = new Date(newEntry.endDate);
        const roiValue = newEntry.wlGenerated > 0 ? newEntry.cost / newEntry.wlGenerated : '-';
        const costPerViewValue = newEntry.views > 0 ? newEntry.cost / newEntry.views : '-';
        const entryToAdd: EventTrackingEntry = {
            ...newEntry,
            id: generateLocalUniqueId('event'),
            startDate: startDateObject,
            endDate: endDateObject,
            roi: roiValue,
            costPerView: costPerViewValue,
        };
        setTrackingData(prevData => ({
            ...prevData,
            eventTracking: [...prevData.eventTracking, entryToAdd].sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)),
        }));
    }, []);

    // --- Paid Traffic Handlers ---
    const handleEditPaidTrafficEntry = useCallback((updatedEntry: PaidTrafficEntry) => {
        setTrackingData(prevData => ({
            ...prevData,
            paidTraffic: prevData.paidTraffic.map(entry => 
                entry.id === updatedEntry.id ? updatedEntry : entry
            ).sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)),
        }));
    }, []);

    const handleDeletePaidTrafficEntry = useCallback((id: string) => {
        setTrackingData(prevData => ({
            ...prevData,
            paidTraffic: prevData.paidTraffic.filter(entry => entry.id !== id),
        }));
        toast.success("Entrada de tráfego pago removida com sucesso.");
    }, []);

    const handleAddPaidTrafficEntry = useCallback((newEntry: Omit<PaidTrafficEntry, 'startDate' | 'endDate' | 'networkConversion' | 'estimatedCostPerWL' | 'validatedCostPerWL'> & { startDate: string, endDate: string }) => {
        const startDateObject = new Date(newEntry.startDate);
        const endDateObject = new Date(newEntry.endDate);
        const networkConversion = newEntry.impressions > 0 ? newEntry.clicks / newEntry.impressions : 0;
        const estimatedCostPerWL = newEntry.estimatedWishlists > 0 ? newEntry.investedValue / newEntry.estimatedWishlists : '-';
        const entryToAdd: PaidTrafficEntry = {
            ...newEntry,
            id: generateLocalUniqueId('paid'),
            startDate: startDateObject,
            endDate: endDateObject,
            networkConversion: networkConversion,
            estimatedCostPerWL: estimatedCostPerWL,
            validatedCostPerWL: '-',
        };
        setTrackingData(prevData => ({
            ...prevData,
            paidTraffic: [...prevData.paidTraffic, entryToAdd].sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)),
        }));
    }, []);

    // --- WL Details Handlers ---
    const handleUpdateWlDetails = useCallback((game: string, newDetails: Partial<TrackingData['wlDetails'][0]>) => {
        setTrackingData(prevData => {
            const updatedWlDetails = prevData.wlDetails.map(detail => {
                if (detail.game === game) {
                    return { ...detail, ...newDetails };
                }
                return detail;
            });
            if (!updatedWlDetails.some(d => d.game === game)) {
                updatedWlDetails.push({ game, reviews: [], bundles: [], traffic: [], ...newDetails });
            }
            return { ...prevData, wlDetails: updatedWlDetails };
        });
    }, []);

    // --- Demo Tracking Handlers ---
    const handleAddDemoEntry = useCallback((newEntry: Omit<DemoTrackingEntry, 'id' | 'date' | 'game'> & { date: string }) => {
        const dateObject = new Date(newEntry.date);
        const entryToAdd: DemoTrackingEntry = {
            ...newEntry,
            id: generateLocalUniqueId('demo'),
            game: selectedGameName,
            date: dateObject,
        } as DemoTrackingEntry; // Cast to DemoTrackingEntry
        setTrackingData(prevData => ({
            ...prevData,
            demoTracking: [...prevData.demoTracking, entryToAdd].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0)),
        }));
        toast.success("Entrada de Demo Tracking adicionada.");
    }, [selectedGameName]);

    const handleEditDemoEntry = useCallback((updatedEntry: DemoTrackingEntry) => {
        setTrackingData(prevData => ({
            ...prevData,
            demoTracking: prevData.demoTracking.map(entry => 
                entry.id === updatedEntry.id ? updatedEntry : entry
            ).sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0)),
        }));
        toast.success("Entrada de Demo Tracking atualizada.");
    }, []);

    const handleDeleteDemoEntry = useCallback((id: string) => {
        setTrackingData(prevData => ({
            ...prevData,
            demoTracking: prevData.demoTracking.filter(entry => entry.id !== id),
        }));
        toast.success("Entrada de Demo Tracking removida com sucesso.");
    }, []);

    // --- Traffic Tracking Handlers ---
    const handleAddTrafficEntry = useCallback((newEntry: AddTrafficFormOutput & { game: string, platform: Platform }) => {
        const entryToAdd: TrafficEntry = {
            id: generateLocalUniqueId('traffic'),
            game: newEntry.game,
            platform: newEntry.platform,
            source: newEntry.source,
            startDate: new Date(newEntry.startDate),
            endDate: new Date(newEntry.endDate),
            visits: newEntry.visits,
            impressions: newEntry.impressions || 0,
            clicks: newEntry.clicks || 0,
        };
        setTrackingData(prevData => ({
            ...prevData,
            trafficTracking: [...prevData.trafficTracking, entryToAdd].sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)),
        }));
        toast.success("Entrada de tráfego/visitas adicionada.");
    }, []);

    // --- Backup/Restore Handlers ---
    const handleCreateBackup = useCallback(() => {
        try {
            const snapshot = {
                influencerTracking: trackingData.influencerTracking,
                influencerSummary: trackingData.influencerSummary,
                eventTracking: trackingData.eventTracking,
                paidTraffic: trackingData.paidTraffic,
                demoTracking: trackingData.demoTracking,
                wlSales: trackingData.wlSales,
                trafficTracking: trackingData.trafficTracking,
                resultSummary: trackingData.resultSummary,
                wlDetails: trackingData.wlDetails,
                manualEventMarkers: trackingData.manualEventMarkers,
            };

            const jsonString = JSON.stringify(snapshot, (_, value) => { // Removed unused 'key' parameter
                if (value instanceof Date) {
                    return value.toISOString();
                }
                return value;
            }, 2);
            
            // convertToCSV expects an array of objects, so we wrap the JSON string
            convertToCSV([{ data: jsonString }], `gogo_tracking_snapshot_${new Date().toISOString().split('T')[0]}.json`);
            toast.success(`Snapshot salvo.`);
        } catch (error) {
            console.error("Snapshot failed:", error);
            toast.error("Falha ao criar o snapshot.");
        }
    }, [trackingData]);

    const handleRestoreBackup = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const snapshot = JSON.parse(content);

                const reviveDates = (obj: any): any => {
                    if (typeof obj === 'object' && obj !== null) {
                        for (const key in obj) {
                            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                                const value = obj[key];
                                if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)) {
                                    obj[key] = startOfDay(new Date(value));
                                } else if (typeof value === 'object' && value !== null) {
                                    obj[key] = reviveDates(value);
                                }
                            }
                        }
                    }
                    return obj;
                };

                const restoredData = reviveDates(snapshot);

                setTrackingData(prevData => ({
                    games: restoredData.games || prevData.games,
                    influencerTracking: restoredData.influencerTracking || [],
                    influencerSummary: restoredData.influencerSummary || [],
                    eventTracking: restoredData.eventTracking || [],
                    paidTraffic: restoredData.paidTraffic || [],
                    demoTracking: restoredData.demoTracking || [],
                    wlSales: restoredData.wlSales || [],
                    trafficTracking: restoredData.trafficTracking || [],
                    resultSummary: restoredData.resultSummary || [],
                    wlDetails: restoredData.wlDetails || [],
                    manualEventMarkers: restoredData.manualEventMarkers || [],
                }));
                
                toast.success("Estado restaurado com sucesso!");
                event.target.value = ''; 
            } catch (error) {
                console.error("Restore failed:", error);
                toast.error("Falha ao restaurar o snapshot.");
            }
        };
        reader.readAsText(file);
    }, []);


    return {
        trackingData,
        setTrackingData,
        handleAIDataProcessed,
        handleEditWLSalesEntry,
        handleAddWLSalesEntry,
        handleAddDailyWLSalesEntry,
        handleDeleteWLSalesEntry,
        handleSaveManualMarker,
        handleDeleteManualMarker,
        handleEditInfluencerEntry,
        handleDeleteInfluencerEntry,
        handleAddInfluencerEntry,
        handleEditEventEntry,
        handleDeleteEventEntry,
        handleAddEventEntry,
        handleEditPaidTrafficEntry,
        handleDeletePaidTrafficEntry,
        handleAddPaidTrafficEntry,
        handleUpdateWlDetails,
        handleAddDemoEntry,
        handleEditDemoEntry,
        handleDeleteDemoEntry,
        handleAddTrafficEntry,
        handleCreateBackup,
        handleRestoreBackup,
    };
};