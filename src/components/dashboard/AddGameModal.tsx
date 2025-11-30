import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import AddGameForm from './AddGameForm';
import WebSearchGameForm from './WebSearchGameForm';
import { GameMetrics } from '@/data/trackingData';

interface AddGameModalProps {
    onGameAdded: (game: GameMetrics) => void;
}

// ... rest of the file