import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Info } from 'lucide-react';
import { invokeGameDataFetcher, GameOption } from '@/integrations/supabase/functions';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

// ... rest of the file