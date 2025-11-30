"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Link as LinkIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { REFERENCES } from '@/lib/constants'; // Importando REFERENCES do novo arquivo

interface Reference {
    title: string;
    source: string;
    description: string;
    url: string;
}

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