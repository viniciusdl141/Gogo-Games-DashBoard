"use client";

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from '@/components/SessionContextProvider';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle } from 'lucide-react';

interface GameData {
  name: string;
  launch_date: string;
  suggested_price: number;
  capsule_image_url?: string;
  developer: string;
  publisher: string;
  review_summary?: string;
  category: string;
}

const SteamDataProcessor: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [previewData, setPreviewData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { supabase, session, user, studioId } = useSession(); // Using user and studioId from context

  const handlePreviewData = async () => {
    if (!jsonInput.trim() || !geminiKey.trim()) {
      toast.error('Por favor, cole o JSON e insira a chave Gemini.');
      return;
    }

    setIsLoading(true);
    setPreviewData(null);
    
    try {
      let parsedJson;
      try {
        parsedJson = JSON.parse(jsonInput);
      } catch (e) {
        toast.error('JSON inválido. Verifique a formatação.');
        setIsLoading(false);
        return;
      }

      // 1. Call the Preview Edge Function
      const functionUrl = 'https://ynlebwtutvyxybqgupke.supabase.co/functions/v1/preview-steam-data';
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          steamJson: parsedJson,
          geminiApiKey: geminiKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro desconhecido ao processar dados.');
      }

      toast.success('Pré-visualização gerada com sucesso pela IA!');
      setPreviewData(result.preview);

    } catch (error) {
      console.error('Processing error:', error);
      toast.error(`Falha ao processar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmInsert = async () => {
    if (!previewData) return;

    setIsLoading(true);
    
    try {
      // 1. Check session and studioId
      if (!session || !studioId) {
        toast.error('Você precisa estar logado e ter um Studio ID associado para inserir dados.');
        setIsLoading(false);
        return;
      }

      // 2. Prepare data for insertion
      const dataToInsert = {
        ...previewData,
        studio_id: studioId, // Using studioId from context
      };

      // 3. Insert Data into Supabase
      const { error } = await supabase
        .from('games')
        .insert([dataToInsert]);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Jogo inserido no banco de dados com sucesso!');
      setPreviewData(null);
      setJsonInput('');
      setGeminiKey('');

    } catch (error) {
      console.error('Insertion error:', error);
      toast.error(`Falha ao inserir no DB: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Processamento de Dados Steamworks (AI)</CardTitle>
        <CardDescription>Use a IA para extrair e formatar dados de jogos antes de inseri-los no seu catálogo.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Chave da API Gemini</Label>
            <Input
              id="gemini-key"
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="steam-json">JSON do Steamworks</Label>
            <Textarea
              id="steam-json"
              placeholder="Cole o JSON capturado aqui..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              disabled={isLoading}
            />
          </div>

          {!previewData ? (
            <Button 
              onClick={handlePreviewData} 
              disabled={isLoading || !jsonInput.trim() || !geminiKey.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Pré-visualização...
                </>
              ) : (
                '1. Gerar Pré-visualização com IA'
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleConfirmInsert} 
              disabled={isLoading || !session || !studioId}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inserindo no Banco de Dados...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  2. Confirmar Inserção do Jogo {session && studioId ? '' : '(Requer Login/Studio ID)'}
                </>
              )}
            </Button>
          )}
          {(!session || !studioId) && previewData && (
            <p className="text-center text-sm text-red-500">Você deve estar logado e ter um Studio ID associado para confirmar a inserção no banco de dados.</p>
          )}
        </div>

        {previewData && (
          <div className="mt-6 p-4 border rounded-lg bg-green-50/50">
            <h3 className="text-lg font-semibold mb-2 text-green-700">Pré-visualização dos Dados (Pronto para Inserir):</h3>
            <ul className="text-sm space-y-1">
              <li><strong>Nome:</strong> {previewData.name}</li>
              <li><strong>Lançamento:</strong> {previewData.launch_date}</li>
              <li><strong>Preço Sugerido (USD):</strong> ${previewData.suggested_price?.toFixed(2)}</li>
              <li><strong>Desenvolvedor:</strong> {previewData.developer}</li>
              <li><strong>Editora:</strong> {previewData.publisher}</li>
              <li><strong>Categoria:</strong> {previewData.category}</li>
              {previewData.review_summary && <li><strong>Resumo:</strong> {previewData.review_summary}</li>}
              {previewData.capsule_image_url && <li><strong>URL da Imagem:</strong> <a href={previewData.capsule_image_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 truncate inline-block max-w-full">{previewData.capsule_image_url}</a></li>}
            </ul>
            <Button variant="outline" onClick={() => setPreviewData(null)} className="mt-4 w-full">
                Limpar Pré-visualização
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SteamDataProcessor;