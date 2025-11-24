"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Search } from 'lucide-react';
import AddGameForm from './AddGameForm';
import WebSearchGameForm from './WebSearchGameForm';

interface AddGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Assinatura atualizada para incluir todos os metadados
    onSave: (
        gameName: string, 
        launchDate: string | null, 
        suggestedPrice: number, 
        capsuleImageUrl: string | null,
        priceUsd: number | null,
        developer: string | null,
        publisher: string | null,
        reviewSummary: string | null,
    ) => void;
}

const AddGameModal: React.FC<AddGameModalProps> = ({ isOpen, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('manual');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
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
                            onSave={(gameName, launchDate, suggestedPrice) => onSave(gameName, launchDate, suggestedPrice, null, null, null, null, null)} 
                            onClose={onClose} 
                        />
                    </TabsContent>
                    
                    <TabsContent value="web-search">
                        <WebSearchGameForm 
                            onSave={(gameName, launchDate, suggestedPrice, capsuleImageUrl, priceUsd, developer, publisher, reviewSummary) => 
                                onSave(gameName, launchDate, suggestedPrice, capsuleImageUrl, priceUsd, developer, publisher, reviewSummary)
                            } 
                            onClose={onClose} 
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default AddGameModal;