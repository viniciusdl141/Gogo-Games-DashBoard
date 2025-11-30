import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WLSalesEntry } from '@/data/trackingData';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { formatDate, formatNumber, cn } from '@/lib/utils'; // Import cn
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { calculateDailySummary } from '@/lib/metrics';

interface WLSalesChartPanelProps {
    wlSalesData: WLSalesEntry[];
    gameName: string;
}

// ... rest of the file