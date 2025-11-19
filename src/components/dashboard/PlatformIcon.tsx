"use client";

import React from 'react';
import { Steam, Xbox, Playstation, Nintendo, Android, Apple, Store, Globe } from 'lucide-react';
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
            return <Xbox className={className} color={color || '#107C10'} />;
        case 'playstation':
            return <Playstation className={className} color={color || '#003791'} />;
        case 'nintendo':
            return <Nintendo className={className} color={color || '#E4000F'} />;
        case 'android':
            return <Android className={className} color={color || '#3DDC84'} />;
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