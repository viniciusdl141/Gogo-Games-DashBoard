"use client";

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

const SteamJsonProcessor: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [aiResult, setAiResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      toast.success(`Arquivo ${selectedFile.name} carregado.`);
    } else {
      setFile(null);
      toast.error('Por favor, selecione um arquivo JSON válido.');
    }
  };

  const processJson = useCallback(async () => {
    if (!apiKey) {
      toast.error('Por favor, insira sua API Key do Gemini.');
      return;
    }
    if (!file) {
      toast.error('Por favor, carregue um arquivo JSON.');
      return;
    }

    setIsLoading(true);
    setAiResult('');
    const reader = new FileReader();

    reader.onload = async (e) => {
      const jsonContent = e.target?.result as string;
      
      const prompt = `Analise este JSON capturado pela minha extensão scraper da Steam e extraia métricas úteis, pontos importantes, padrões, eventos relevantes e insights correlacionados. JSON: \n\n${jsonContent}`;

      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `Erro na API Gemini: ${response.status}`);
        }

        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Nenhuma resposta útil recebida da IA.';
        setAiResult(resultText);
        toast.success('Processamento concluído com sucesso!');

      } catch (error) {
        console.error('Erro ao processar JSON com IA:', error);
        setAiResult(`Erro: ${error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'}`);
        toast.error('Falha ao processar JSON. Verifique a chave e o formato do JSON.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
      toast.error('Erro ao ler o arquivo.');
    };

    reader.readAsText(file);
  }, [apiKey, file]);

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        <Label htmlFor="gemini-key">Chave API Gemini</Label>
        <Input
          id="gemini-key"
          type="password"
          placeholder="Insira sua chave API aqui"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <Label htmlFor="json-upload">Upload de Arquivo JSON da Steam</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="json-upload"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="flex-grow"
          />
          {file && (
            <span className="text-sm text-gray-500 truncate max-w-[150px]">
              {file.name}
            </span>
          )}
        </div>
      </div>

      <Button
        onClick={processJson}
        disabled={isLoading || !apiKey || !file}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" />
            Processar JSON com IA
          </>
        )}
      </Button>

      {aiResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Zap className="mr-2 h-5 w-5 text-blue-500" />
              Resultado da Análise IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={aiResult}
              readOnly
              rows={15}
              className="min-h-[300px] font-mono text-sm whitespace-pre-wrap"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SteamJsonProcessor;