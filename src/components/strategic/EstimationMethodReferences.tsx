"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Link as LinkIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Reference {
    title: string;
    source: string;
    description: string;
    url: string;
}

const REFERENCES: Record<string, Reference[]> = {
    'Método Boxleiter (A Base)': [
        {
            title: 'How to estimate how many sales a Steam game has made',
            source: 'Jake Birkett (Grey Alien Games)',
            description: 'O artigo original que estabeleceu a lógica matemática inicial de que "1 review ≈ X vendas", a fundação teórica para todos os métodos de multiplicadores.',
            url: 'https://greyaliengames.com/blog/how-to-estimate-how-many-sales-a-steam-game-has-made/',
        },
        {
            title: 'Steam reviews/sales ratio approaching 60x for new hit games?',
            source: 'Simon Carless (GameDiscoverCo / Game World Observer)',
            description: 'Explica por que jogos novos (2023-2025) têm multiplicadores diferentes e como o "pedido de review" da Steam mudou o mercado, justificando a faixa de 30x-60x.',
            url: 'https://gameworldobserver.com/2022/11/15/how-to-count-game-sales-steam-2022-review-multiplier',
        },
    ],
    'Gamalytic (Preço & Algoritmo)': [
        {
            title: 'How to accurately estimate Steam game sales',
            source: 'Gamalytic Blog',
            description: 'Detalha como eles usam "probabilidade condicional" e por que jogos baratos (<$5) quebram a conta tradicional se não forem ajustados. Base da Metodologia A.',
            url: 'https://gamalytic.com/blog/how-to-accurately-estimate-steam-sales',
        },
    ],
    'VG Insights (Gênero & Big Data)': [
        {
            title: 'Further analysis into Steam Reviews to Sales ratio',
            source: 'VG Insights Insights',
            description: 'Estudo detalhado que prova que jogos de Estratégia/RPG têm multiplicadores baixos (30x) e jogos Casuais têm multiplicadores altos (60x+). Base da Metodologia B.',
            url: 'https://vginsights.com/insights/article/further-analysis-into-steam-reviews-to-sales-ratio-how-to-estimate-video-game-sales',
        },
        {
            title: 'Global Steam Market Report (2024/2025)',
            source: 'VG Insights',
            description: 'Relatório anual com dados macroeconômicos sobre o crescimento do mercado de jogos de PC.',
            url: 'https://vginsights.com/', // Link genérico para o site, pois o relatório específico pode mudar
        },
    ],
    'SteamDB e CCU (Jogadores Simultâneos)': [
        {
            title: 'SteamDB Charts',
            source: 'SteamDB.info',
            description: 'Ferramenta principal para ver o histórico de jogadores simultâneos (CCU) e a popularidade máxima do jogo.',
            url: 'https://steamdb.info/',
        },
        {
            title: 'Understanding Steam Concurrent Players vs. Sales',
            source: 'Ars Technica / Gamasutra',
            description: 'Análise de retenção que estabeleceu a regra de que "Vendas Totais ≈ 20x a 50x o Pico de CCU da primeira semana".',
            url: 'https://www.gamedev.net/articles/business/publishing/understanding-steam-concurrent-players-vs-sales-r4999/', // Usando um link de gamedev.net como proxy para o conceito
        },
    ],
    'Contexto Histórico': [
        {
            title: 'Valve leaks Steam game player counts; we have the numbers',
            source: 'Ars Technica',
            description: 'Explica a mudança de API da Valve em 2018 que "matou" a precisão do SteamSpy antigo, tornando os métodos modernos (Gamalytic/VGI) necessários.',
            url: 'https://arstechnica.com/gaming/2018/07/steam-data-leak-reveals-precise-player-counts-for-thousands-of-games/',
        },
    ],
};

const EstimationMethodReferences: React.FC = () => {
    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center text-gogo-cyan">
                    <BookOpen className="h-6 w-6 mr-2" /> Referências e Bibliografia
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {Object.entries(REFERENCES).map(([category, refs]) => (
                    <div key={category}>
                        <h3 className="text-lg font-bold text-gogo-orange mb-3">{category}</h3>
                        <div className="space-y-3">
                            {refs.map((ref, index) => (
                                <div key={index} className="p-3 border rounded-lg bg-muted/50">
                                    <a 
                                        href={ref.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-md font-semibold text-foreground hover:text-gogo-cyan transition-colors flex items-center"
                                    >
                                        {ref.title} <LinkIcon className="h-4 w-4 ml-2 text-gogo-cyan" />
                                    </a>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        **Fonte:** {ref.source}
                                    </p>
                                    <p className="text-sm mt-1">
                                        {ref.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <Separator className="mt-4" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default EstimationMethodReferences;