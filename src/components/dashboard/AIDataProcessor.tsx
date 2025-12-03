"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { invokeAIDataProcessor } from '@/integrations/supabase/functions';
import { Loader2, Bot, Upload, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import AIDataPreview from './AIDataPreview'; // Importar o novo componente
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StructuredData {
    influencerTracking: any[];
    eventTracking: any[];
    paidTraffic: any[];
    wlSales: any[];
    demoTracking: any[];
    trafficTracking: any[];
    manualEventMarkers: any[];
}

interface AIDataProcessorProps {
    gameName: string;
    onDataProcessed: (data: StructuredData) => void;
    onClose: () => void;
}

// Apenas Gemini como provedor padrão
const AI_PROVIDER = 'gemini';

const AIDataProcessor: React.FC<AIDataProcessorProps> = ({ gameName, onDataProcessed, onClose }) => {
    const [rawData, setRawData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [processedData, setProcessedData] = useState<StructuredData | null>(null);

    const handleProcessData = async () => {
        if (!rawData.trim()) {
            toast.error("Por favor, insira os dados brutos para processamento.");
            return;
        }

        setIsLoading(true);
        setProcessedData(null);
        toast.loading("Enviando dados para a IA processar...", { id: 'ai-processing' });

        try {
            // A chave da API Gemini agora deve ser configurada como um segredo no Supabase (GEMINI_API_KEY)
            const response = await invokeAIDataProcessor(rawData, gameName, 'SERVER_SECRET_KEY', AI_PROVIDER); 
            
            toast.dismiss('ai-processing');
            
            if (response.structuredData && Object.values(response.structuredData).some(arr => arr.length > 0)) {
                setProcessedData(response.structuredData as StructuredData);
                toast.success("Dados processados. Revise e aprove a inserção.");
            } else {
                toast.error("A IA retornou dados vazios ou inválidos. Verifique o formato de entrada.");
            }

        } catch (error) {
            console.error("AI Processing Error:", error);
            toast.dismiss('ai-processing');
            // O erro agora deve conter a mensagem detalhada da Edge Function
            toast.error(`Falha no processamento da IA: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApprove = () => {
        if (processedData) {
            onDataProcessed(processedData);
            onClose();
        }
    };

    const handleCancelPreview = () => {
        setProcessedData(null);
        toast.info("Pré-visualização cancelada. Você pode tentar novamente.");
    };

    if (processedData) {
        return (
            <div className="space-y-4">
                <AIDataPreview data={processedData} />
                <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={handleCancelPreview}>
                        <X className="mr-2 h-4 w-4" /> Cancelar Pré-visualização
                    </Button>
                    <Button 
                        onClick={handleApprove} 
                        className="bg-gogo-orange hover:bg-gogo-orange/90"
                    >
                        <Check className="mr-2 h-4 w-4" /> Aprovar e Inserir Dados
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Card className="border-none shadow-none">
            <CardHeader>
                <CardTitle className="flex items-center text-gogo-cyan">
                    <Bot className="h-5 w-5 mr-2" /> Processamento de Dados Brutos por IA (Gemini)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Cole aqui o conteúdo bruto (ex: texto de planilha, CSV, ou dados não estruturados) para que a IA os converta em entradas estruturadas para o jogo **{gameName}**.
                </p>
                
                <p className="text-xs text-red-500">
                    ⚠️ **AVISO DE CONFIGURAÇÃO:** A chave da API Gemini deve ser configurada como um segredo de ambiente (`GEMINI_API_KEY`) na sua Edge Function.
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
            </CardContent>
        </Card>
    );
};

export default AIDataProcessor;