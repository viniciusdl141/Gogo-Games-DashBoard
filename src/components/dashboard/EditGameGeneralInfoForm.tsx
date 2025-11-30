import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameMetrics } from '@/data/trackingData';
import { Image, Loader2, Search } from 'lucide-react';
import { updateGameDetails } from '@/integrations/supabase/games';
import { MOCK_CATEGORIES } from '@/lib/constants'; // Importando MOCK_CATEGORIES
import { toast } from 'sonner';

// ... rest of the file