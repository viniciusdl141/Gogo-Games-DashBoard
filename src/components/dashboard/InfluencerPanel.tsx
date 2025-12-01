"use client";

import React, { useState } from 'react';
import { InfluencerSummaryEntry, InfluencerTrackingEntry } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { Trash2, Edit, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditInfluencerForm from './EditInfluencerForm';

interface InfluencerPanelProps {
    summary: InfluencerSummaryEntry[];
    tracking: InfluencerTrackingEntry[];
    onDeleteTracking: (id: string) => void;
    onEditTracking: (entry: InfluencerTrackingEntry) => void;
    games: string[];
    isPresentationMode?: boolean; // NEW PROP
}

const InfluencerPanel: React.FC<InfluencerPanelProps> = ({ summary, tracking, onDeleteTracking, onEditTracking, games, isPresentationMode = false }) => {
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    // ... (restante do código)