"use client";

import React, { useState, useEffect } from 'react';
import { differenceInDays, isFuture, isPast, startOfDay } from 'date-fns';
import { Clock, Rocket, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LaunchTimerProps {
    launchDate: Date | null;
}

const LaunchTimer: React.FC<LaunchTimerProps> = ({ launchDate }) => {
    const [timeStatus, setTimeStatus] = useState<'future' | 'past' | 'today' | 'unknown'>('unknown');
    const [days, setDays] = useState<number | null>(null);

    useEffect(() => {
        if (!launchDate) {
            setTimeStatus('unknown');
            setDays(null);
            return;
        }

        const now = startOfDay(new Date());
        const launchDay = startOfDay(launchDate);

        if (isFuture(launchDay)) {
            const daysUntil = differenceInDays(launchDay, now);
            setTimeStatus('future');
            setDays(daysUntil);
        } else if (isPast(launchDay)) {
            const daysSince = differenceInDays(now, launchDay);
            setTimeStatus('past');
            setDays(daysSince);
        } else {
            // If not future and not past, it must be today (or the same day)
            setTimeStatus('today');
            setDays(0);
        }
    }, [launchDate]);

    const renderContent = () => {
        switch (timeStatus) {
            case 'future':
                return (
                    <div className="flex items-center space-x-2 text-gogo-cyan">
                        <Rocket className="h-5 w-5" />
                        <span className="font-semibold">{days} dias</span>
                        <span className="text-sm text-muted-foreground">até o lançamento</span>
                    </div>
                );
            case 'past':
                return (
                    <div className="flex items-center space-x-2 text-gogo-orange">
                        <Calendar className="h-5 w-5" />
                        <span className="font-semibold">{days} dias</span>
                        <span className="text-sm text-muted-foreground">desde o lançamento</span>
                    </div>
                );
            case 'today':
                return (
                    <div className="flex items-center space-x-2 text-green-500">
                        <Rocket className="h-5 w-5 animate-pulse" />
                        <span className="font-semibold">LANÇAMENTO HOJE!</span>
                    </div>
                );
            case 'unknown':
            default:
                return (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <Clock className="h-5 w-5" />
                        <span className="text-sm">Data de lançamento não definida.</span>
                    </div>
                );
        }
    };

    return (
        <div className={cn(
            "p-3 rounded-lg transition-all duration-300",
            timeStatus === 'future' && "bg-gogo-cyan/10 border border-gogo-cyan/30",
            timeStatus === 'past' && "bg-gogo-orange/10 border border-gogo-orange/30",
            timeStatus === 'today' && "bg-green-500/10 border border-green-500/30",
            timeStatus === 'unknown' && "bg-muted/50 border border-border"
        )}>
            {renderContent()}
        </div>
    );
};

export default LaunchTimer;