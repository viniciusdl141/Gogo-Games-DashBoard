"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { invokeAIDataProcessor } from '@/integrations/supabase/functions';
import { Loader2, Bot, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AIDataProcessorProps {
    gameName: string;
    onDataProcessed: (data: any) => void;
    onClose: () => void;
}

const AIDataProcessor: React.FC<AIDataProcessorProps> = ({ gameName, onDataProcessed, onClose }) => {
    const [rawData, setRawData] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleProcessData = async () => {
        if (!rawData.trim()) {
            toast.error("Por favor, insira os dados brutos para processamento.");
            return;
        }

        setIsLoading(true);
        toast.loading("Enviando dados para a IA processar...", { id: 'ai-processing' });

        try {
            const response = await invokeAIDataProcessor(rawData, gameName);
            
            toast.dismiss('ai-processing');
            toast.success("Dados processados com sucesso pela IA!");
            
            // Pass structured data back to the dashboard
            onDataProcessed(response.structuredData);
            onClose();

        } catch (error) {
            console.error("AI Processing Error:", error);
            toast.dismiss('ai-processing');
            toast.error(`Falha no processamento da IA: ${error.message}. Verifique o console.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-none shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center text-gogo-cyan">
                    <Bot className="h-5 w-5 mr-2" /> Processamento de Dados Brutos por IA
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Cole aqui o conteúdo bruto (ex: texto de planilha, CSV, ou dados não estruturados) para que a IA os converta em entradas estruturadas para o jogo **{gameName}**.
                </p>
                <Textarea
                    placeholder="Cole seus dados brutos aqui..."
                    value={rawData}
                    onChange={(e) => setRawData(e.target.value)}
                    rows={10}
                    disabled={isLoading}
                />
                <div className="flex justify-end space-x-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleProcessData} 
                        disabled={isLoading || !rawData.trim()}
                        className="bg-gogo-cyan hover:bg-gogo-cyan/90"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        Processar com IA
                    </Button>
                </div>
                <p className="text-xs text-red-500">
                    ⚠️ **Atenção:** Esta função usa um mock de IA. Para funcionar em produção, você deve configurar uma API de IA real (ex: OpenAI) dentro da Edge Function `process-raw-data`.
                </p>
            </CardContent>
        </Card>
    );
};

export default AIDataProcessor;