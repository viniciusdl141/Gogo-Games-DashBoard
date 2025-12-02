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
    'Método Boxleiter (Reviews-to-Sales)': [
        {
            title: 'A Regra de Ouro: 1 Review ≈ 30x a 60x Vendas',
            source: 'Jake Birkett (Grey Alien Games) & Simon Carless (GameDiscoverCo)',
            description: 'A fundação teórica que estima vendas totais multiplicando o número de reviews por um fator (multiplicador). Multiplicadores mais baixos (30x-40x) são comuns para jogos de nicho/RPG, enquanto mais altos (50x-70x) são para jogos casuais ou de grande sucesso.',
            url: 'https://greyaliengames.com/blog/how-to-estimate-how-many-sales-a-steam-game-has-made/',
        },
        {
            title: 'Ajuste de Multiplicador por Gênero',
            source: 'VG Insights Insights',
            description: 'Estudos mostram que o multiplicador varia drasticamente por gênero. Jogos de Estratégia/RPG tendem a ter 30x-40x, enquanto jogos Casuais/Simulação podem ter 60x-80x.',
            url: 'https://vginsights.com/insights/article/further-analysis-into-steam-reviews-to-sales-ratio-how-to-estimate-video-game-sales',
        },
    ],
    'Método CCU (Pico de Jogadores Simultâneos)': [
        {
            title: 'CCU Peak Multiplier (20x a 50x)',
            source: 'Ars Technica / Gamasutra',
            description: 'Estima as vendas totais multiplicando o pico máximo de jogadores simultâneos (CCU Peak) da primeira semana por um fator. Fatores mais baixos (20x-30x) indicam alta retenção, e mais altos (40x-50x) indicam baixa retenção.',
            url: 'https://www.gamedev.net/articles/business/publishing/understanding-steam-concurrent-players-vs-sales-r4999/',
        },
    ],
    'Método Wishlist-to-Sales (Conversão WL)': [
        {
            title: 'Taxa de Conversão de Wishlist (10% a 25%)',
            source: 'Vários Desenvolvedores e GDC Talks',
            description: 'Estima as vendas do primeiro ano (ou lançamento) multiplicando o total de Wishlists no dia do lançamento pela taxa de conversão esperada. A média histórica é de 10% a 25% de conversão de WL em vendas.',
            url: 'https://partner.steamgames.com/doc/marketing/wishlist', // Link genérico para documentação Steam
        },
    ],
    'Gamalytic e Algoritmos Modernos': [
        {
            title: 'How to accurately estimate Steam game sales',
            source: 'Gamalytic Blog',
            description: 'Detalha como algoritmos modernos usam probabilidade condicional e ajustam o multiplicador com base no preço, data de lançamento e visibilidade do jogo.',
            url: 'https://gamalytic.com/blog/how-to-accurately-estimate-steam-sales',
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