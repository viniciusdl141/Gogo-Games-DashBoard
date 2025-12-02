"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Brain } from 'lucide-react';
import SteamJsonProcessor from './SteamJsonProcessor';

const ProcessJsonButton: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center">
          <Brain className="mr-2 h-4 w-4" />
          Processar JSON Steam (IA)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Análise de Dados Steam com Gemini AI</DialogTitle>
        </DialogHeader>
        <SteamJsonProcessor />
      </DialogContent>
    </Dialog>
  );
};

export default ProcessJsonButton;