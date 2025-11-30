import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GameMetrics } from '@/data/trackingData';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Calendar, DollarSign, List, Info, RefreshCw } from 'lucide-react';
import EditGameGeneralInfoForm from './EditGameGeneralInfoForm';
import { updateGameDetails } from '@/integrations/supabase/games';

interface GameSummaryPanelProps {
    game: GameMetrics;
    onGameUpdated: (updatedGame: GameMetrics) => void;
}

// ... rest of the file