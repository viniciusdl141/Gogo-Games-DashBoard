"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { processSteamScraperJson, StructuredResponse } from '@/utils/steamScraper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bot } from 'lucide-react';

interface SteamScraperImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SteamScraperImportModal: React.FC<SteamScraperImportModalProps> = ({ isOpen, onClose }) => {
  const [rawJson, setRawJson] = useState('');
  // Usando a chave fornecida pelo usuário como valor inicial
  const [apiKey, setApiKey] = useState('AIzaSyCao7UHpJgeYGExguqjvecUwdeztYhnxWU'); 
  const [isLoading, setIsLoading] = useState(false);
  const [structuredPreview, setStructuredPreview] = useState<StructuredResponse | null>(null);

  const handleProcess = async () => {
    if (!rawJson || !apiKey) {
      alert('Por favor, cole o JSON bruto e insira a Chave da API Gemini.');
      return;
    }

    try {
      // Validação básica de JSON antes de enviar para a IA
      JSON.parse(rawJson);
    } catch (e) {
      alert('O texto inserido não é um JSON válido.');
      return;
    }

    setIsLoading(true);
    setStructuredPreview(null);

    try {
      const result = await processSteamScraperJson(rawJson, apiKey);
      setStructuredPreview(result);
    } catch (error) {
      // O tratamento de erro já é feito dentro de processSteamScraperJson usando toast
      console.error("Processing failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRawJson('');
    // Mantemos a chave da API para conveniência
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
            Cole o JSON bruto do scraper e forneça sua chave Gemini para estruturar e importar os dados dos jogos.
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
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
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
          <Button onClick={handleProcess} disabled={isLoading || !rawJson || !apiKey} className="bg-gogo-cyan hover:bg-gogo-cyan/90">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
            Processar JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SteamScraperImportModal;