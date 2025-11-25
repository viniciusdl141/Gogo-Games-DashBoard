"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Gamepad, Calendar, DollarSign, MessageSquare, Clock, BarChart3, Info, Check } from 'lucide-react';
import { invokeSalesAnalyzer, SalesAnalysisReport } from '@/integrations/supabase/functions';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GameSalesAnalyzerProps {
    gameName: string;
}

// Hardcoded API Key (as provided by the user)
const GEMINI_API_KEY = 'AIzaSyCao7UHpJgeYGExguqjvecUwdeztYhnxWU';

const GameSalesAnalyzer: React.FC<GameSalesAnalyzerProps> = ({ gameName }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<SalesAnalysisReport | null>(null);
    const [aiApiKey, setAiApiKey] = useState(GEMINI_API_KEY);

    const handleAnalyze = async () => {
        if (!gameName) {
            toast.error("Selecione um jogo para analisar.");
            return;
        }
        if (!aiApiKey) {
            toast.error("A chave da API Gemini é obrigatória.");
            return;
        }

        setIsLoading(true);
        setReport(null);
        toast.loading(`Analisando vendas e performance de "${gameName}"...`, { id: 'sales-analysis' });

        try {
            const result = await invokeSalesAnalyzer(gameName, aiApiKey);
            setReport(result);
            toast.success("Análise de vendas concluída!");
        } catch (error) {
            console.error("Sales Analysis Error:", error);
            toast.error(`Falha na análise: ${error.message}.`);
        } finally {
            setIsLoading(false);
            toast.dismiss('sales-analysis');
        }
    };

    const renderReport = () => {
        if (!report) return null;

        const { 
            gameName, launchDate, timeSinceLaunch, tags, 
            reviews, priceBRL, priceUSD, ccuPeak, ccuPeakDate, ccuCurrent,
            estimationResults, averageSales, temporalAnalysis, analystNotes 
        } = report;

        return (
            <div className="space-y-6 mt-6">
                <Card className="p-4 bg-muted/50">
                    <h2 className="text-xl font-bold text-gogo-cyan mb-2">JOGO: {gameName}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <p className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-muted-foreground" /> **LANÇAMENTO:** {launchDate} ({timeSinceLaunch})</p>
                        <p className="flex items-center"><MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" /> **REVIEWS:** {formatNumber(reviews)}</p>
                        <p className="flex items-center"><DollarSign className="h-4 w-4 mr-2 text-muted-foreground" /> **PREÇO BRL:** {formatCurrency(priceBRL)}</p>
                        <p className="flex items-center"><DollarSign className="h-4 w-4 mr-2 text-muted-foreground" /> **PREÇO USD:** {formatCurrency(priceUSD).replace('R$', 'USD')}</p>
                        <p className="flex items-center"><BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" /> **PICO CCU:** {formatNumber(ccuPeak)} ({ccuPeakDate})</p>
                        <p className="flex items-center"><BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" /> **CCU ATUAL:** {formatNumber(ccuCurrent)}</p>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">**TAGS DETECTADAS:** {tags.join(', ')}</p>
                </Card>

                {/* 1. Estimativa de Volume */}
                <Card>
                    <CardHeader><CardTitle className="text-lg">1. Estimativa de Volume</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[20%]">Método</TableHead>
                                    <TableHead className="w-[30%]">Lógica/Conflito</TableHead>
                                    <TableHead className="text-center w-[15%]">Multiplicador</TableHead>
                                    <TableHead className="text-right w-[25%]">Vendas Totais Est.</TableHead>
                                    <TableHead className="w-[10%]">ℹ️</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {estimationResults.map((res, index) => (
                                    <TableRow key={index} className={res.method.includes('MÉDIA') ? 'bg-gogo-orange/10 font-bold' : ''}>
                                        <TableCell className="font-medium">{res.method.replace(' Sim.', '')}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{res.logic}</TableCell>
                                        <TableCell className="text-center">{res.multiplier}x</TableCell>
                                        <TableCell className="text-right text-lg font-bold text-gogo-cyan">{formatNumber(res.estimatedSales)} un.</TableCell>
                                        <TableCell className="text-center">
                                            {res.method.includes('VG Insights') && (
                                                <Tooltip>
                                                    <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p>{analystNotes.conflictExplanation}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-gogo-orange/20 font-bold">
                                    <TableCell colSpan={3} className="text-right">MÉDIA GERAL</TableCell>
                                    <TableCell className="text-right text-xl text-gogo-orange">{formatNumber(averageSales)} un.</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* 2. Performance e Tempo */}
                <Card>
                    <CardHeader><CardTitle className="text-lg">2. Performance e Tempo (Timeline)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <KpiCard 
                                title="Tempo de Mercado" 
                                value={`${temporalAnalysis.averageSpeed.split(' ')[0]} meses`} 
                                icon={<Clock className="h-4 w-4 text-gogo-cyan" />}
                                description={timeSinceLaunch}
                            />
                            <KpiCard 
                                title="Velocidade Média de Vendas" 
                                value={temporalAnalysis.averageSpeed} 
                                icon={<TrendingUp className="h-4 w-4 text-gogo-orange" />}
                                description="Cópia vendidas por mês (Média Geral / Meses)"
                            />
                            <KpiCard 
                                title="Veredito Temporal" 
                                value={temporalAnalysis.verdict} 
                                icon={<Check className="h-4 w-4 text-green-500" />}
                                description="Sprinter (Hype inicial) ou Marathoner (Vendas consistentes)"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            **Momento do Pico:** {temporalAnalysis.peakMomentInterpretation}
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Conclusão Final */}
                <Card>
                    <CardHeader><CardTitle className="text-lg">3. Conclusão Final</CardTitle></CardHeader>
                    <CardContent>
                        <p className="font-semibold mb-2">Resumo Executivo:</p>
                        <p className="text-sm">{analystNotes.conclusion}</p>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xl flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-gogo-orange" /> Análise de Vendas (Steam Expert)
                </CardTitle>
                <Button 
                    onClick={handleAnalyze} 
                    disabled={isLoading || !gameName}
                    className="bg-gogo-cyan hover:bg-gogo-cyan/90"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Search className="h-4 w-4 mr-2" />
                    )}
                    {report ? 'Refazer Análise' : `Analisar ${gameName}`}
                </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="ai-api-key">Chave da API Gemini</Label>
                    <Input
                        id="ai-api-key"
                        type="password"
                        placeholder="AIzaSy..."
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        disabled={isLoading}
                    />
                    <p className="text-xs text-red-500">
                        ⚠️ **AVISO DE SEGURANÇA:** A chave da API é enviada diretamente do seu navegador para a Edge Function.
                    </p>
                </div>
                
                {isLoading && <p className="text-center text-muted-foreground">Aguarde, a IA está buscando dados e realizando cálculos complexos...</p>}
                
                {report && renderReport()}
            </CardContent>
        </Card>
    );
};

export default GameSalesAnalyzer;