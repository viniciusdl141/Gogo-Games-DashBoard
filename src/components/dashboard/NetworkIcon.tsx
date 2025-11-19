"use client";

import React from 'react';
import { Facebook, Youtube, MessageSquare, TrendingUp, Globe } from 'lucide-react';

interface NetworkIconProps {
    network: string;
    className?: string;
}

const NetworkIcon: React.FC<NetworkIconProps> = ({ network, className = "h-5 w-5" }) => {
    const normalizedNetwork = network.toLowerCase().replace(/ - .*/, '').trim();

    switch (normalizedNetwork) {
        case 'meta':
            return <Facebook className={className} color="#1877F2" />;
        case 'youtube':
            return <Youtube className={className} color="#FF0000" />;
        case 'reddit':
            return <MessageSquare className={className} color="#FF4500" />; // Usando MessageSquare no lugar de Reddit
        case 'tiktok':
            return <TrendingUp className={className} color="#000000" />; 
        default:
            return <Globe className={className} color="#6b7280" />;
    }
};

export default NetworkIcon;