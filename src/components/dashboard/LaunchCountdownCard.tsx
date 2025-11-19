"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from 'lucide-react';
import { differenceInDays, isPast, isFuture } from 'date-fns';
import { formatNumber } from '@/lib/utils';

interface LaunchCountdownCardProps {
    launchDate: Date | null;
}

const LaunchCountdownCard: React.FC<LaunchCountdownCardProps> = ({ launchDate }) => {
    if (!launchDate) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status de Lançamento</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">-</div>
                    <p className="text-xs text-muted-foreground">Data de lançamento não definida.</p>
                </CardContent>
            </Card>
        );
    }

    const today = new Date();
    const daysDiff = differenceInDays(launchDate, today);

    let text: string;
    let colorClass: string;
    let description: string;

    if (isFuture(launchDate, { additionalDigits: 0 })) {
        text = `Lançamento em ${formatNumber(daysDiff)} dias!`;
        colorClass = 'text-gogo-orange'; // Tom de vermelho/laranja chamativo
        description = `Faltam ${formatNumber(daysDiff)} dias para o lançamento.`;
    } else if (isPast(launchDate, { additionalDigits: 0 })) {
        const daysSinceLaunch = Math.abs(daysDiff);
        text = `Lançado há ${formatNumber(daysSinceLaunch)} dias!`;
        colorClass = 'text-gogo-cyan'; // Tom de ciano para indicar que já passou
        description = `O jogo foi lançado há ${formatNumber(daysSinceLaunch)} dias.`;
    } else { // Hoje
        text = `Lançamento HOJE!`;
        colorClass = 'text-green-500'; // Verde para indicar o dia do lançamento
        description = `O jogo está sendo lançado hoje!`;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status de Lançamento</CardTitle>
                <Calendar className={`h-4 w-4 ${colorClass}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${colorClass}`}>{text}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
};

export default LaunchCountdownCard;