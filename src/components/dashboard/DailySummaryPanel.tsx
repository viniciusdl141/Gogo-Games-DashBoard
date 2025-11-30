import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from "@/components/ui/separator";
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils';
import { startOfDay, isBefore, isEqual } from 'date-fns';
import { WLSalesEntry, ManualEventMarker } from '@/data/trackingData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, TrendingUp, DollarSign, List, Info } from 'lucide-react';
import { calculateDailySummary } from '@/lib/metrics';

interface DailySummaryPanelProps {
    wlSalesData: WLSalesEntry[];
    manualEvents: ManualEventMarker[];
    gameName: string;
}

// ... rest of the file