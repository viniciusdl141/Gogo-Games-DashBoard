"use client";

import React, { useState } from 'react';
import { EventTrackingEntry } from '@/data/trackingData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatNumber, cn } from '@/lib/utils';
import { Trash2, Edit, Calendar, DollarSign, Eye } from 'lucide-react';
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
import EditEventForm from './EditEventForm';

interface EventPanelProps {
    data: EventTrackingEntry[];
    onDeleteTracking: (id: string) => void;
    onEditTracking: (entry: EventTrackingEntry) => void;
    games: string[];
    isPresentationMode?: boolean; // NEW PROP
}

const EventPanel: React.FC<EventPanelProps> = ({ data, onDeleteTracking, onEditTracking, games, isPresentationMode = false }) => {
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    // ... (restante do código)