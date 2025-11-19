"use client";

import React from 'react';
import { Monitor, Gamepad, Smartphone, Apple, Store, Globe, Gamepad2 } from 'lucide-react'; // Importando ícones disponíveis
import { Platform } from '@/data/trackingData';

interface PlatformIconProps {
    platform: Platform;
    className?: string;
    color?: string; // Keep color prop for explicit overrides if needed, but prefer Tailwind classes
}

const PlatformIcon: React.FC<PlatformIconProps> = ({ platform, className = "h-4 w-4", color }) => {
    const normalizedPlatform = platform.toLowerCase().replace(/\s/g, '');

    // Map normalized platform to a Tailwind color class
    const getColorClass = (plat: string) => {
        switch (plat) {
            case 'steam': return 'text-platform-steam';
            case 'xbox': return 'text-platform-xbox';
            case 'playstation': return 'text-platform-playstation';
            case 'nintendo': return 'text-platform-nintendo';
            case 'android': return 'text-platform-android';
            case 'ios': return 'text-platform-ios';
            case 'epicgames': return 'text-platform-epicgames';
            default: return 'text-platform-outra';
        }
    };

    const colorClass = color ? '' : getColorClass(normalizedPlatform); // Use color prop if provided, else use Tailwind class

    switch (normalizedPlatform) {
        case 'steam':
            return <Monitor className={`${className} ${colorClass}`} style={color ? { color } : undefined} />; // Usando Monitor para Steam
        case 'xbox':
            return <Gamepad className={`${className} ${colorClass}`} style={color ? { color } : undefined} />;
        case 'playstation':
            return <Gamepad2 className={`${className} ${colorClass}`} style={color ? { color } : undefined} />;
        case 'nintendo':
            return <Gamepad className={`${className} ${colorClass}`} style={color ? { color } : undefined} />;
        case 'android':
            return <Smartphone className={`${className} ${colorClass}`} style={color ? { color } : undefined} />;
        case 'ios':
            return <Apple className={`${className} ${colorClass}`} style={color ? { color } : undefined} />;
        case 'epicgames':
            return <Store className={`${className} ${colorClass}`} style={color ? { color } : undefined} />;
        case 'outra':
        default:
            return <Globe className={`${className} ${colorClass}`} style={color ? { color } : undefined} />;
    }
};

export default PlatformIcon;