"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Search } from 'lucide-react';
import AddGameForm from './AddGameForm';
import WebSearchGameForm from './WebSearchGameForm';
import { Studio } from '@/types/supabase';

interface AddGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (gameName: string, launchDate: string | null, suggestedPrice: number, capsuleImageUrl: string | null, studioId: string | null) => void;
    isAdmin: boolean;
    studios: Studio[];
    defaultStudioId: string | null;
}

const AddGameModal: React.FC<AddGameModalProps> = ({ isOpen, onClose, onSave, isAdmin, studios, defaultStudioId }) => {
    const [activeTab, setActiveTab] = useState('manual');

    // Wrapper function to ensure studioId is passed correctly
    const handleSaveManual = (gameName: string, launchDate: string | null, suggestedPrice: number, studioId: string | null) => {
        onSave(gameName, launchDate, suggestedPrice, null, studioId);
    };
    
    // Wrapper function to ensure studioId is passed correctly
    const handleSaveWebSearch = (gameName: string, launchDate: string | null, suggestedPrice: number, capsuleImageUrl: string | null, studioId: string | null) => {
        onSave(gameName, launchDate, suggestedPrice, capsuleImageUrl, studioId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Jogo</DialogTitle>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual" className="flex items-center">
                            <List className="h-4 w-4 mr-2" /> Manual
                        </TabsTrigger>
                        <TabsTrigger value="web-search" className="flex items-center">
                            <Search className="h-4 w-4 mr-2" /> Busca Web
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="manual">
                        <AddGameForm 
                            onSave={handleSaveManual} 
                            onClose={onClose} 
                            isAdmin={isAdmin}
                            studios={studios}
                            defaultStudioId={defaultStudioId}
                        />
                    </TabsContent>
                    
                    <TabsContent value="web-search">
                        <WebSearchGameForm 
                            onSave={handleSaveWebSearch} 
                            onClose={onClose} 
                            isAdmin={isAdmin}
                            studios={studios}
                            defaultStudioId={defaultStudioId}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default AddGameModal;