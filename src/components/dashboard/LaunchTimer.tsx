import React, { useState, useEffect, useMemo } from 'react';
import { differenceInDays, isFuture, isPast, format } from 'date-fns';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LaunchTimerProps {
    launchDate: Date | null;
}

const LaunchTimer: React.FC<LaunchTimerProps> = ({ launchDate }) => {
    const [isLaunched, setIsLaunched] = useState(false);
    const [daysCount, setDaysCount] = useState<number | null>(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        // Update 'now' every minute to keep the timer relatively accurate
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000); 

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!launchDate) {
            setIsLaunched(false);
            setDaysCount(null);
            return;
        }

        // Check if the launch date is in the future or past relative to 'now'
        if (isFuture(launchDate, now)) {
            const daysUntil = differenceInDays(launchDate, now);
            setIsLaunched(false);
            setDaysCount(daysUntil);
        } else if (isPast(launchDate, now)) {
            const daysSince = differenceInDays(now, launchDate);
            setIsLaunched(true);
            setDaysCount(daysSince);
        } else {
            // If it's today
            setIsLaunched(true);
            setDaysCount(0);
        }
    }, [launchDate, now]);

    const statusText = useMemo(() => {
        if (!launchDate) {
            return "Data de Lançamento Não Definida";
        }
        if (daysCount === null) {
            return "Calculando...";
        }
        if (daysCount === 0) {
            return "Lançamento Hoje!";
        }
        if (isLaunched) {
            return `${daysCount} dias desde o lançamento`;
        } else {
            return `${daysCount} dias até o lançamento`;
        }
    }, [launchDate, daysCount, isLaunched]);

    const themeClasses = useMemo(() => {
        if (!launchDate) {
            return "bg-gray-100 text-gray-600";
        }
        if (isLaunched) {
            return "bg-gogo-green/10 text-gogo-green border-gogo-green";
        }
        if (daysCount !== null && daysCount <= 30) {
            return "bg-gogo-orange/10 text-gogo-orange border-gogo-orange";
        }
        return "bg-gogo-cyan/10 text-gogo-cyan border-gogo-cyan";
    }, [launchDate, isLaunched, daysCount]);

    return (
        <Card className={cn("border-2 transition-colors", themeClasses)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {isLaunched ? "Status de Lançamento" : "Contagem Regressiva"}
                </CardTitle>
                <Clock className={cn("h-4 w-4", isLaunched ? "text-gogo-green" : "text-gogo-cyan")} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {daysCount !== null ? daysCount : '--'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {statusText}
                </p>
                {launchDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Data: {format(launchDate, 'MMM dd, yyyy')}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default LaunchTimer;