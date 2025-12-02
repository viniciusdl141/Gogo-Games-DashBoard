"use client";

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '@/integrations/supabase/supabase-provider';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface GamePreview {
  name: string;
  launch_date: string;
  suggested_price: number;
  developer: string;
  publisher: string;
  category: string;
}

const SteamDataProcessor: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [preview, setPreview] = useState<GamePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { supabase } = useSupabase();

  const handleProcessData = async () => {
    if (!jsonInput.trim()) {
      toast.error('Por favor, cole o JSON do Steamworks.');
      return;
    }

    setIsLoading(true);
    setPreview(null);
    
    try {
      // 1. Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado para processar dados.');
        setIsLoading(false);
        return;
      }

      // 2. Call the Edge Function
      const functionUrl = 'https://ynlebwtutvyxybqgupke.supabase.co/functions/v1/process-steam-data';
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ steamJson: JSON.parse(jsonInput) }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro desconhecido ao processar dados.');
      }

      toast.success('Dados processados e jogo adicionado com sucesso!');
      setPreview(result.preview);
      setJsonInput(''); // Clear input after success

    } catch (error) {
      console.error('Processing error:', error);
      toast.error(`Falha ao processar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Processar Dados do Steamworks (via Gemini AI)</CardTitle>
        <CardDescription>Cole o JSON capturado da página do Steamworks abaixo. A IA irá extrair, formatar e inserir os dados do jogo automaticamente.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder="Cole o JSON do Steamworks aqui..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />
          <Button 
            onClick={handleProcessData} 
            disabled={isLoading || !jsonInput.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando com IA...
              </>
            ) : (
              'Processar e Adicionar Jogo'
            )}
          </Button>
        </div>

        {preview && (
          <div className="mt-6 p-4 border rounded-lg bg-green-50/50">
            <h3 className="text-lg font-semibold mb-2 text-green-700">Pré-visualização do Jogo Adicionado:</h3>
            <ul className="text-sm space-y-1">
              <li><strong>Nome:</strong> {preview.name}</li>
              <li><strong>Lançamento:</strong> {preview.launch_date}</li>
              <li><strong>Preço Sugerido (USD):</strong> ${preview.suggested_price?.toFixed(2)}</li>
              <li><strong>Desenvolvedor:</strong> {preview.developer}</li>
              <li><strong>Categoria:</strong> {preview.category}</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SteamDataProcessor;