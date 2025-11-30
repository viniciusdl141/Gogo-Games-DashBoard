import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { WLSalesEntry } from '@/data/trackingData';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, List, Minus } from 'lucide-react';
import KpiCard from './KpiCard';
import { calculateWlConversionMetrics } from '@/lib/metrics';

interface WlConversionKpisPanelProps {
    wlSalesData: WLSalesEntry[];
    gameName: string;
}

// ... rest of the file