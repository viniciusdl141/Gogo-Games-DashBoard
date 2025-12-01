"use client";

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Calculator, TrendingUp, DollarSign, MessageSquare, Gauge, List, Info, CheckSquare, Clock, BookOpen } from 'lucide-react'; 
import KpiCard from '../dashboard/KpiCard'; 
import { GameOption } from '@/integrations/supabase/games';
import { TrackingData } from '@/data/trackingData';
import { toast } from 'sonner';

// Tipagem para o jogo estimado (EXPORTADO)
export interface EstimatedGame extends GameOption {
    estimatedSales: number;
    estimatedRevenue: number;
    estimationMethod: string;
    timeframe: string;
}

// ... (restante do código)