import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from '@/lib/utils';
import {
    Plus,
    Trash2,
    Edit,
    RefreshCw,
    Users,
    Gamepad2,
    Building2,
    ArrowLeft,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

// Supabase Integrations
import { getStudios, addStudio, updateStudio, deleteStudio, Studio } from '@/integrations/supabase/studios';
import { fetchGamesByStudio, deleteGame as deleteGameFromSupabase } from '@/integrations/supabase/games';
import StudioForm from '@/components/admin/StudioForm';
import { GameMetrics, Profile } from '@/data/trackingData';
import { fetchAllProfiles, updateProfileRole } from '@/integrations/supabase/profiles';

// --- Component ---

const AdminPanel: React.FC = () => {
    const { isAdmin, isLoading: isSessionLoading } = useSession();
    const navigate = useNavigate();

    // ... rest of the file