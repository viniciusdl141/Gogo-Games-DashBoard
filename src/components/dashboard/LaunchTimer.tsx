"use client";

import React, { useState, useEffect } from 'react';
import { formatDistanceToNowStrict, differenceInDays, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Rocket } from 'lucide-react';

interface LaunchTimerProps {
    launchDate: Date | null;
}

const LaunchTimer: React.FC<LaunchTimerProps> = ({ launchDate }) => {
    const [timeStatus, setTimeStatus] = useState<string | null>(null);
    const [isLaunched, setIsLaunched] = useState<boolean | null>(null);

    useEffect(() => {
        if (!launchDate) {
            setTimeStatus(null);
            setIsLaunched(null);
            return;
        }

        const calculateTime = () => {
            const now = new Date();
            
            if (isFuture(launchDate, { now })) {
                const daysUntil = differenceInDays(launchDate, now);
                setTimeStatus(`${daysUntil} dias para o lançamento`);
                setIsLaunched(false);
            } else if (isPast(launchDate, { now })) {
                const daysSince = differenceInDays(now, launchDate);
                setTimeStatus(`Lançado há ${daysSince} dias`);
                setIsLaunched(true);
            } else { // Today
                setTimeStatus("Lançamento HOJE!");
                setIsLaunched(true);
            }
        };

        calculateTime(); // Initial calculation

        const interval = setInterval(calculateTime, 1000 * 60 * 60); // Update every hour
        return () => clearInterval(interval);
    }, [launchDate]);

    if (timeStatus === null) {
        return null; // Don't render if no launch date is provided
    }

    const textColorClass = isLaunched ? 'text-gogo-cyan' : 'text-gogo-orange'; // Laranja para contagem regressiva, Ciano para lançado

    return (
        <div className={`flex items-center justify-center p-3 rounded-lg border border-current ${textColorClass} font-bold text-lg shadow-md`}>
            <Rocket className="h-5 w-5 mr-2" />
            <span>{timeStatus}</span>
        </div>
    );
};

export default LaunchTimer;