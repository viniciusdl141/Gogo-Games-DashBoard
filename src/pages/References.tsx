"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Link as LinkIcon } from 'lucide-react';
import { REFERENCES, Reference } from '@/lib/constants';

const ReferencesPage: React.FC = () => {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-4xl font-extrabold text-gogo-orange flex items-center">
                <BookOpen className="h-8 w-8 mr-3" /> Referências e Fontes
            </h1>
            <p className="text-lg text-muted-foreground">
                As metodologias de estimativa de vendas utilizadas são baseadas em análises de mercado e estudos de desenvolvedores renomados.
            </p>

            {Object.entries(REFERENCES).map(([category, refs]) => (
                <Card key={category} className="shadow-lg border-t-4 border-gogo-cyan/50">
                    <CardHeader>
                        <CardTitle className="text-2xl text-gogo-cyan">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {refs.map((ref: Reference, index: number) => (
                            <div key={index} className="p-4 border rounded-lg bg-muted/20">
                                <h3 className="text-xl font-semibold text-foreground">{ref.title}</h3>
                                <p className="text-sm text-gogo-orange font-medium mt-1">Fonte: {ref.source}</p>
                                <p className="mt-2 text-muted-foreground">{ref.description}</p>
                                <a 
                                    href={ref.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center mt-3 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    <LinkIcon className="h-4 w-4 mr-1" /> Acessar Fonte
                                </a>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default ReferencesPage;