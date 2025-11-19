"use client";

import React from 'react';
import { Steam, Gamepad, Smartphone, Apple, Store, Globe, Gamepad2 } from 'lucide-react'; // Importando ícones disponíveis
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
            return <Steam className={className} color={color || '#1B2838'} />;
        case 'xbox':
            return <Gamepad className={className} color={color || '#107C10'} />; // Usando Gamepad para Xbox
        case 'playstation':
            return <Gamepad2 className={className} color={color || '#003791'} />; // Usando Gamepad2 para Playstation
        case 'nintendo':
            return <Gamepad className={className} color={color || '#E4000F'} />; // Usando Gamepad para Nintendo
        case 'android':
            return <Smartphone className={className} color={color || '#3DDC84'} />; // Usando Smartphone para Android
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