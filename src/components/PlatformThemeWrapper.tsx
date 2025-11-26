"use client";

import React, { useMemo } from 'react';
import { Platform } from '@/data/trackingData';
import { cn } from '@/lib/utils';

interface PlatformThemeWrapperProps {
    selectedPlatform: Platform | 'All';
    children: React.ReactNode;
}

const PlatformThemeWrapper: React.FC<PlatformThemeWrapperProps> = ({ selectedPlatform, children }) => {
    const themeClass = useMemo(() => {
        switch (selectedPlatform) {
            case 'Playstation':
                return 'theme-playstation ps-background-pattern';
            case 'Nintendo':
                return 'theme-nintendo nintendo-background-pattern';
            case 'Steam':
            case 'Xbox':
            case 'Android':
            case 'iOS':
            case 'Epic Games':
            case 'Outra':
            case 'All':
            default:
                return 'gaming-background'; // Default theme
        }
    }, [selectedPlatform]);

    return (
        <div className={cn("min-h-screen w-full", themeClass)}>
            {children}
        </div>
    );
};

export default PlatformThemeWrapper;