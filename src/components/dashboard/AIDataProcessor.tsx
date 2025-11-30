import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AIDataPreview from './AIDataPreview'; // Importar o novo componente
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RawTrackingData, GameMetrics } from '@/data/trackingData';
import { Brain, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// ... rest of the file