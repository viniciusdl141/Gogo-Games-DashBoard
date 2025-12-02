import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Zap, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AIInsight {
  summary: string;
  key_metrics: string;
  insights: string;
  suggestions: string;
  market_interpretations: string;
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

const SteamJsonAIProcessor: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    setFile(selectedFile);
    setError(null);
  };

  const buildPrompt = (jsonContent: string) => {
    return `Analise esse JSON de tráfego e métricas da Steam (capturado pelo meu scraper).
Extraia insights úteis para análise de mercado, wishlist, interesse do jogador, padrão de tráfego, endpoints relevantes, oportunidades e alertas de performance.

Formate sua resposta estritamente como um objeto JSON com as seguintes chaves: 'summary', 'key_metrics', 'insights', 'suggestions', 'market_interpretations'. O valor de cada chave deve ser um texto formatado em Markdown.

JSON a ser analisado:
---
${jsonContent}
---`;
  };

  const processData = useCallback(async () => {
    if (!apiKey) {
      toast.error("Por favor, insira sua API Key do Gemini.");
      return;
    }
    if (!file) {
      toast.error("Por favor, selecione um arquivo JSON.");
      return;
    }

    setIsLoading(true);
    setInsights(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonContent = e.target?.result as string;
        
        // Basic validation to ensure it looks like JSON
        JSON.parse(jsonContent); 

        const prompt = buildPrompt(jsonContent);

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `Erro na API Gemini: ${response.status}`);
        }

        const data = await response.json();
        const geminiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!geminiResponseText) {
          throw new Error("Resposta inválida da API Gemini.");
        }

        // Attempt to parse the structured JSON response from Gemini
        const cleanedResponse = geminiResponseText.replace(/```json\n|```/g, '').trim();
        const parsedInsights: AIInsight = JSON.parse(cleanedResponse);
        
        setInsights(parsedInsights);
        toast.success("Análise de dados concluída!");

      } catch (err) {
        console.error("Erro ao processar dados:", err);
        setError(`Falha ao processar dados. Verifique a API Key, o formato do JSON ou a resposta da IA. Detalhe: ${err instanceof Error ? err.message : String(err)}`);
        toast.error("Erro ao processar dados. Veja o painel para detalhes.");
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Erro ao ler o arquivo.");
      setIsLoading(false);
    };

    reader.readAsText(file);
  }, [apiKey, file]);

  const InsightCard: React.FC<{ title: string; content: string }> = ({ title, content }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-indigo-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap text-sm text-gray-700">{content}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <Zap className="w-6 h-6 mr-2 text-indigo-600" />
        Análise de Dados Steam com Gemini
      </h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="gemini-api-key" className="block text-sm font-medium text-gray-700 mb-1">
            Sua API Key do Gemini
          </label>
          <Input
            id="gemini-api-key"
            type="password"
            placeholder="Insira sua chave aqui (não será salva)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="json-upload" className="block text-sm font-medium text-gray-700 mb-1">
            Upload de Arquivo JSON Steam
          </label>
          <Input
            id="json-upload"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full file:text-sm file:font-medium"
          />
          {file && (
            <p className="mt-1 text-xs text-gray-500 flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              Arquivo selecionado: {file.name}
            </p>
          )}
        </div>

        <Button 
          onClick={processData} 
          disabled={isLoading || !apiKey || !file}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            "Processar Dados com IA"
          )}
        </Button>
      </div>

      {/* Display Area for Insights */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">Resultados da Análise</h3>
        
        {error && (
          <Card className="border-red-500 bg-red-50 p-4">
            <div className="flex items-center text-red-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <p className="font-medium">Erro:</p>
            </div>
            <p className="mt-1 text-sm">{error}</p>
          </Card>
        )}

        {insights && (
          <div className="space-y-4">
            <InsightCard title="Resumo Executivo" content={insights.summary} />
            <InsightCard title="Métricas Chave" content={insights.key_metrics} />
            <InsightCard title="Insights Detalhados" content={insights.insights} />
            <InsightCard title="Sugestões e Oportunidades" content={insights.suggestions} />
            <InsightCard title="Interpretações de Mercado" content={insights.market_interpretations} />
          </div>
        )}

        {!isLoading && !error && !insights && (
          <p className="text-center text-gray-500 text-sm">
            Aguardando o processamento do JSON para gerar insights.
          </p>
        )}
      </div>
    </div>
  );
};

export default SteamJsonAIProcessor;