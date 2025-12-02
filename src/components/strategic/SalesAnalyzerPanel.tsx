"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Bot, Loader2, Search, DollarSign, List, Gauge, Clock, MessageSquare, TrendingUp } from 'lucide-react'; 
import { GameOption } from '@/integrations/supabase/games';
import { invokeSalesAnalyzer, SalesAnalysisReport } from '@/integrations/supabase/functions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
    gameName: z.string().min(1, "Selecione um jogo."),
    aiApiKey: z.string().min(1, "A chave da API Gemini é obrigatória."),
});

type AnalyzerFormValues = z.infer<typeof formSchema>;

interface SalesAnalyzerPanelProps {
    allGames: GameOption[];
}

const SalesAnalyzerPanel: React.FC<SalesAnalyzerPanelProps> = ({ allGames }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<SalesAnalysisReport | null>(null);
    
    // Usando a chave fornecida pelo usuário como valor inicial
    const initialApiKey = 'AIzaSyBX7maloS1javL5woTMI1bKyxZ5o2Pbl18'; 

    const form = useForm<AnalyzerFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gameName: allGames[0]?.name || '',
            aiApiKey: initialApiKey,
        },
    });

    const handleAnalyze = async (values: AnalyzerFormValues) => {
        setIsLoading(true);
        setReport(null);
        toast.loading(`Gerando relatório de análise de vendas para "${values.gameName}"...`, { id: 'sales-analysis' });

        try {
            const result = await invokeSalesAnalyzer(values.gameName, values.aiApiKey);
            setReport(result);
            toast.dismiss('sales-analysis');
            toast.success(`Relatório de análise de vendas para ${values.gameName} gerado com sucesso!`);
        } catch (error) {
            console.error("Sales Analysis Error:", error);
            toast.dismiss('sales-analysis');
            toast.error(`Falha ao gerar relatório: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderReport = (report: SalesAnalysisReport) => (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gogo-orange">Relatório de Análise de Vendas: {report.gameName}</h3>
            
            {/* Metadados e KPIs */}
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-xl flex items-center text-gogo-cyan"><List className="h-5 w-5 mr-2" /> Metadados e Performance</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard title="Lançamento" value={report.launchDate} description={report.timeSinceLaunch} icon={<Clock className="h-4 w-4 text-gogo-cyan" />} />
                    <KpiCard title="Reviews Totais" value={formatNumber(report.reviews)} description="Base para estimativas" icon={<MessageSquare className="h-4 w-4 text-gogo-orange" />} />
                    <KpiCard title="Pico CCU" value={formatNumber(report.ccuPeak)} description={`Em ${report.ccuPeakDate}`} icon={<TrendingUp className="h-4 w-4 text-green-500" />} />
                    <KpiCard title="Preço (BRL)" value={formatCurrency(report.priceBRL)} description={`USD: ${formatCurrency(report.priceUSD).replace('R$', 'USD')}`} icon={<DollarSign className="h-4 w-4 text-gogo-cyan" />} />
                    
                    <div className="col-span-full">
                        <p className="text-sm font-medium mb-1">Tags/Gêneros:</p>
                        <div className="flex flex-wrap gap-2">
                            {report.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Resultados da Estimativa */}
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-xl flex items-center text-gogo-orange"><Gauge className="h-5 w-5 mr-2" /> Estimativas de Vendas</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto mb-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="py-2 text-left">Método</th>
                                    <th className="py-2 text-left">Lógica</th>
                                    <th className="py-2 text-right">Multiplicador</th>
                                    <th className="py-2 text-right">Vendas Estimadas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.estimationResults.map((res, index) => (
                                    <tr key={index} className="border-b last:border-b-0">
                                        <td className="py-2 font-medium">{res.method}</td>
                                        <td className="py-2 text-muted-foreground text-xs">{res.logic}</td>
                                        <td className="py-2 text-right">{res.multiplier}x</td>
                                        <td className="py-2 text-right font-bold text-gogo-cyan">{formatNumber(res.estimatedSales)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Separator />
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg flex justify-between items-center">
                        <p className="text-lg font-bold">Média de Vendas Estimadas:</p>
                        <p className="text-2xl font-extrabold text-gogo-orange">{formatNumber(report.averageSales)} unidades</p>
                    </div>
                </CardContent>
            </Card>

            {/* Análise Temporal e Notas do Analista */}
            <Card className="shadow-lg">
                <CardHeader><CardTitle className="text-xl flex items-center text-gogo-cyan"><Bot className="h-5 w-5 mr-2" /> Análise Estratégica da IA</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 border rounded-lg bg-gogo-cyan/10">
                        <p className="font-semibold text-gogo-cyan mb-1">Veredito de Performance:</p>
                        <p className="text-sm">{report.temporalAnalysis.verdict}</p>
                    </div>
                    
                    <div className="p-3 border rounded-lg bg-muted/50">
                        <p className="font-semibold text-foreground mb-1">Interpretação do Pico:</p>
                        <p className="text-sm text-muted-foreground">{report.temporalAnalysis.peakMomentInterpretation}</p>
                    </div>
                    
                    <Separator />
                    
                    <div className="p-3 border rounded-lg bg-gogo-orange/10">
                        <p className="font-semibold text-gogo-orange mb-1">Conclusão e Recomendação:</p>
                        <p className="text-sm">{report.analystNotes.conclusion}</p>
                    </div>
                    
                    {report.analystNotes.conflictExplanation && (
                        <div className="p-3 border border-red-500/50 rounded-lg bg-red-500/10">
                            <p className="font-semibold text-red-500 mb-1">Conflito de Métodos:</p>
                            <p className="text-sm text-muted-foreground">{report.analystNotes.conflictExplanation}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center text-gogo-cyan">
                    <Bot className="h-6 w-6 mr-2" /> Gerador de Relatório de Análise de Vendas (IA)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAnalyze)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="gameName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jogo para Análise</FormLabel>
                                        <Input placeholder="Nome do Jogo" {...field} disabled={isLoading} />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="aiApiKey"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chave da API Gemini</FormLabel>
                                        <Input type="password" placeholder="AIzaSy..." {...field} disabled={isLoading} />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex items-end">
                                <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full bg-gogo-orange hover:bg-gogo-orange/90">
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Search className="h-4 w-4 mr-2" />
                                    )}
                                    Gerar Relatório
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>

                <Separator />

                {report ? (
                    renderReport(report)
                ) : (
                    <p className="text-muted-foreground text-center p-8">
                        Insira o nome de um jogo e sua chave Gemini para gerar um relatório de análise de vendas detalhado.
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default SalesAnalyzerPanel;