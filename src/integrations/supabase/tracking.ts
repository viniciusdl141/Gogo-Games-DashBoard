import { supabase } from './client';
import { 
    RawTrackingData, 
    WLSalesEntry, 
    TrafficEntry, 
    InfluencerTrackingEntry, 
    EventTrackingEntry, 
    PaidTrafficEntry, 
    DemoTrackingEntry, 
    WlDetails 
} from '@/data/trackingData';
import { toast } from 'sonner';

// --- Helper function to fetch all tracking data for a studio ---

export async function fetchTrackingData(studioId: string): Promise<RawTrackingData | null> {
    // NOTE: In a real application, fetching all data in one go might be inefficient.
    // We assume for this dashboard context, we fetch all relevant tables.

    const [
        wlSalesResult,
        influencersResult,
        eventsResult,
        paidTrafficResult,
        demoTrackingResult,
        trafficResult,
        manualEventsResult,
        wlDetailsResult,
    ] = await Promise.all([
        supabase.from('wl_sales').select('*').eq('studio_id', studioId),
        supabase.from('influencers').select('*').eq('studio_id', studioId),
        supabase.from('events').select('*').eq('studio_id', studioId),
        supabase.from('paid_traffic').select('*').eq('studio_id', studioId),
        supabase.from('demo_tracking').select('*').eq('studio_id', studioId),
        supabase.from('traffic').select('*').eq('studio_id', studioId),
        supabase.from('manual_events').select('*').eq('studio_id', studioId),
        supabase.from('wl_details').select('*').eq('studio_id', studioId),
    ]);

    if (wlSalesResult.error || influencersResult.error || eventsResult.error || paidTrafficResult.error || demoTrackingResult.error || trafficResult.error || manualEventsResult.error || wlDetailsResult.error) {
        console.error("Error fetching tracking data:", 
            wlSalesResult.error || influencersResult.error || eventsResult.error || paidTrafficResult.error || demoTrackingResult.error || trafficResult.error || manualEventsResult.error || wlDetailsResult.error
        );
        toast.error('Falha ao carregar dados de rastreamento.');
        return null;
    }

    // Convert date strings to Date objects
    const parseDates = (data: any[]) => data.map(item => ({
        ...item,
        date: item.date ? new Date(item.date) : null,
        // Handle specific date fields if necessary (e.g., start/end dates for events/traffic)
        startDate: item.start_date ? new Date(item.start_date) : undefined,
        endDate: item.end_date ? new Date(item.end_date) : undefined,
    }));

    return {
        wlSales: parseDates(wlSalesResult.data) as WLSalesEntry[],
        influencers: parseDates(influencersResult.data) as InfluencerTrackingEntry[],
        events: parseDates(eventsResult.data) as EventTrackingEntry[],
        paidTraffic: parseDates(paidTrafficResult.data) as PaidTrafficEntry[],
        demoTracking: parseDates(demoTrackingResult.data) as DemoTrackingEntry[],
        traffic: parseDates(trafficResult.data) as TrafficEntry[],
        manualEvents: parseDates(manualEventsResult.data) as any, // Assuming ManualEventMarker structure is correct
        wlDetails: wlDetailsResult.data as WlDetails[], // Assuming WlDetails handles internal structure (reviews/bundles)
    };
}

// --- CRUD Operations (Simplified) ---

export async function saveTrackingData(studioId: string, data: RawTrackingData): Promise<boolean> {
    // NOTE: This function is a placeholder. In a real app, we would handle upserts/deletes granularly.
    // For now, we assume the dashboard handles local state and only calls specific add/delete/update functions.
    toast.info("A função 'Salvar Dados' está desabilitada. Use os botões 'Adicionar' e 'Deletar' nos painéis.");
    return true;
}

// --- Add Entry Functions ---

export async function addWLSalesEntry(studioId: string, entry: Omit<WLSalesEntry, 'id'>): Promise<WLSalesEntry | null> {
    const { data, error } = await supabase
        .from('wl_sales')
        .insert({ 
            ...entry, 
            studio_id: studioId,
            date: entry.date.toISOString().split('T')[0], // Store date as ISO string
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding WL Sales entry:', error);
        toast.error('Falha ao adicionar entrada de WL/Vendas.');
        return null;
    }
    return { ...data, date: new Date(data.date) } as WLSalesEntry;
}

export async function addTrafficEntry(studioId: string, entry: Omit<TrafficEntry, 'id'>): Promise<TrafficEntry | null> {
    const { data, error } = await supabase
        .from('traffic')
        .insert({ 
            ...entry, 
            studio_id: studioId,
            date: entry.date.toISOString().split('T')[0],
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding Traffic entry:', error);
        toast.error('Falha ao adicionar entrada de Tráfego.');
        return null;
    }
    return { ...data, date: new Date(data.date) } as TrafficEntry;
}

export async function addInfluencerEntry(studioId: string, entry: Omit<InfluencerTrackingEntry, 'id'>): Promise<InfluencerTrackingEntry | null> {
    const { data, error } = await supabase
        .from('influencers')
        .insert({ 
            ...entry, 
            studio_id: studioId,
            date: entry.date.toISOString().split('T')[0],
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding Influencer entry:', error);
        toast.error('Falha ao adicionar entrada de Influencer.');
        return null;
    }
    return { ...data, date: new Date(data.date) } as InfluencerTrackingEntry;
}

export async function addEventEntry(studioId: string, entry: Omit<EventTrackingEntry, 'id'>): Promise<EventTrackingEntry | null> {
    const { data, error } = await supabase
        .from('events')
        .insert({ 
            ...entry, 
            studio_id: studioId,
            date: entry.date.toISOString().split('T')[0],
            start_date: entry.startDate.toISOString().split('T')[0],
            end_date: entry.endDate.toISOString().split('T')[0],
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding Event entry:', error);
        toast.error('Falha ao adicionar entrada de Evento.');
        return null;
    }
    return { 
        ...data, 
        date: new Date(data.date),
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
    } as EventTrackingEntry;
}

export async function addPaidTrafficEntry(studioId: string, entry: Omit<PaidTrafficEntry, 'id'>): Promise<PaidTrafficEntry | null> {
    const { data, error } = await supabase
        .from('paid_traffic')
        .insert({ 
            ...entry, 
            studio_id: studioId,
            date: entry.date.toISOString().split('T')[0],
            start_date: entry.startDate.toISOString().split('T')[0],
            end_date: entry.endDate.toISOString().split('T')[0],
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding Paid Traffic entry:', error);
        toast.error('Falha ao adicionar entrada de Tráfego Pago.');
        return null;
    }
    return { 
        ...data, 
        date: new Date(data.date),
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
    } as PaidTrafficEntry;
}

export async function addDemoTrackingEntry(studioId: string, entry: Omit<DemoTrackingEntry, 'id'>): Promise<DemoTrackingEntry | null> {
    const { data, error } = await supabase
        .from('demo_tracking')
        .insert({ 
            ...entry, 
            studio_id: studioId,
            date: entry.date.toISOString().split('T')[0],
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding Demo Tracking entry:', error);
        toast.error('Falha ao adicionar entrada de Demo Tracking.');
        return null;
    }
    return { ...data, date: new Date(data.date) } as DemoTrackingEntry;
}

export async function updateWlDetails(studioId: string, details: WlDetails): Promise<WlDetails | null> {
    // This is complex as it involves nested JSON updates (reviews, bundles).
    // For simplicity, we assume the entire JSON object is stored/updated.
    const { data, error } = await supabase
        .from('wl_details')
        .upsert({ 
            game: details.game, 
            studio_id: studioId,
            suggested_price: details.suggestedPrice,
            launch_date: details.launchDate?.toISOString().split('T')[0],
            reviews: details.reviews,
            bundles: details.bundles,
        }, { onConflict: 'game, studio_id' })
        .select()
        .single();

    if (error) {
        console.error('Error updating WL Details:', error);
        toast.error('Falha ao atualizar detalhes do Wishlist.');
        return null;
    }
    return data as WlDetails;
}

export async function deleteEntry(studioId: string, table: keyof RawTrackingData, id: string): Promise<boolean> {
    // Map RawTrackingData keys to actual Supabase table names
    const tableMap: Record<keyof RawTrackingData, string> = {
        wlSales: 'wl_sales',
        influencers: 'influencers',
        events: 'events',
        paidTraffic: 'paid_traffic',
        demoTracking: 'demo_tracking',
        traffic: 'traffic',
        manualEvents: 'manual_events',
        wlDetails: 'wl_details',
    };

    const tableName = tableMap[table];

    if (!tableName) {
        console.error('Invalid table name for deletion:', table);
        return false;
    }

    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('studio_id', studioId);

    if (error) {
        console.error(`Error deleting entry from ${tableName}:`, error);
        toast.error(`Falha ao deletar entrada de ${table}.`);
        return false;
    }

    return true;
}