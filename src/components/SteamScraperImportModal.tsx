"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bot } from 'lucide-react';
import { invokeAIDataProcessor } from '@/integrations/supabase/functions';
import { toast } from 'sonner';

// Define a estrutura esperada da Edge Function Gemini
interface StructuredGameData {
  appId?: string;
  name: string;
  wishlistDelta?: number;
  followers?: number;
  tags?: string[];
  reviews?: string;
  owners?: string;
  price?: number; // Mapeia para price_usd
  releaseDate?: string; // Mapeia para launch_date
}

export interface StructuredResponse {
    games: StructuredGameData[];
}

interface SteamScraperImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string; // Adicionando gameName para passar para a IA
  onDataProcessed: (data: any) => void; // Função para lidar com os dados estruturados
}

// Apenas Gemini como provedor padrão
const AI_PROVIDER = 'gemini';

const SteamScraperImportModal: React.FC<SteamScraperImportModalProps> = ({ isOpen, onClose, gameName, onDataProcessed }) => {
  const [rawJson, setRawJson] = useState('');
  // Usando a chave fornecida pelo usuário como valor inicial
  const [aiApiKey, setAiApiKey] = useState('AIzaSyBewls5qn39caQJu8fnlxDwmR7aoyHjyLE'); 
  const [isLoading, setIsLoading] = useState(false);
  const [structuredPreview, setStructuredPreview] = useState<any | null>(null);

  const handleProcess = async () => {
    if (!rawJson || !aiApiKey) {
      toast.error('Por favor, cole o JSON bruto e insira a Chave da API Gemini.');
      return;
    }

    setIsLoading(true);
    setStructuredPreview(null);
    toast.loading("Enviando dados para a IA processar...", { id: 'ai-processing-scraper' });

    try {
      // Chamada à função genérica de processamento de dados
      const result = await invokeAIDataProcessor(rawJson, gameName, aiApiKey, AI_PROVIDER);
      
      toast.dismiss('ai-processing-scraper');
      
      if (result.structuredData && Object.values(result.structuredData).some(arr => arr.length > 0)) {
          setStructuredPreview(result.structuredData);
          toast.success("Dados processados. Revise e aprove a inserção.");
      } else {
          toast.error("A IA retornou dados vazios ou inválidos. Verifique o formato de entrada.");
      }

    } catch (error) {
      toast.dismiss('ai-processing-scraper');
      toast.error("Erro: " + error.message);
      console.error("Processing failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApprove = () => {
      if (structuredPreview) {
          onDataProcessed(structuredPreview);
          handleClose();
      }
  };

  const handleClose = () => {
    setRawJson('');
    setStructuredPreview(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-gogo-cyan">
            <Bot className="h-5 w-5 mr-2" /> Importar JSON (Steam Scraper)
          </DialogTitle>
          <DialogDescription>
            Cole o JSON bruto do scraper e forneça sua chave Gemini para estruturar e importar os dados de tracking para o jogo **{gameName}**.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="raw-json" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Cole o JSON bruto aqui
            </label>
            <Textarea
              id="raw-json"
              placeholder="Insira o JSON bruto do Steam Scraper..."
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              rows={10}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="gemini-key" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Chave da API Gemini
            </label>
            <Input
              id="gemini-key"
              type="password"
              placeholder="Insira sua chave da API Gemini"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {structuredPreview && (
            <div className="space-y-2 mt-4 p-3 border rounded-lg bg-muted/50">
              <h4 className="text-md font-semibold text-gogo-orange">Preview do JSON Estruturado (Retorno da IA):</h4>
              <pre className="bg-card p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap border">
                {JSON.stringify(structuredPreview, null, 2)}
              </pre>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          {structuredPreview ? (
              <Button onClick={handleApprove} className="bg-gogo-orange hover:bg-gogo-orange/90">
                  <Check className="mr-2 h-4 w-4" /> Aprovar e Inserir Dados
              </Button>
          ) : (
              <Button onClick={handleProcess} disabled={isLoading || !rawJson || !aiApiKey} className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
                  Processar JSON
              </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SteamScraperImportModal;