"use client";

import React from 'react';
import { Monitor, Gamepad, Smartphone, Apple, Store, Globe, Gamepad2 } from 'lucide-react'; // Importando ícones disponíveis
import { Platform } from '@/data/trackingData';

interface PlatformIconProps {
    platform: Platform;
    className?: string;
    color?: string;
}

const PlatformIcon: React.FC<PlatformIconProps> = ({ platform, className = "h-4 w-4", color }) => {
    const normalizedPlatform = platform.toLowerCase().replace(/\s/g, '');

    switch (normalizedPlatform) {
        case 'steam':
            return <Monitor className={className} color={color || '#1B2838'} />; // Usando Monitor para Steam
        case 'xbox':
            return <Gamepad className={className} color={color || '#107C10'} />;
        case 'playstation':
            return <Gamepad2 className={className} color={color || '#003791'} />;
        case 'nintendo':
            return <Gamepad className={className} color={color || '#E4000F'} />;
        case 'android':
            return <Smartphone className={className} color={color || '#3DDC84'} />;
        case 'ios':
            return <Apple className={className} color={color || '#000000'} />;
        case 'epicgames':
            return <Store className={className} color={color || '#313131'} />;
        case 'outra':
        default:
            return <Globe className={className} color={color || '#6B7280'} />;
    }
};

export default PlatformIcon;