"use client";

import React from 'react';
import { Facebook, Youtube, MessageSquare, TrendingUp, Globe, Search } from 'lucide-react';

interface NetworkIconProps {
    network: string;
    className?: string;
}

const NetworkIcon: React.FC<NetworkIconProps> = ({ network, className = "h-5 w-5" }) => {
    const normalizedNetwork = network.toLowerCase().replace(/ - .*/, '').trim();

    // Map normalized network to a Tailwind color class
    const getColorClass = (net: string) => {
        switch (net) {
            case 'meta': return 'text-network-meta';
            case 'youtube': return 'text-network-youtube';
            case 'reddit': return 'text-network-reddit';
            case 'tiktok': return 'text-network-tiktok';
            case 'google ads': return 'text-network-googleads';
            default: return 'text-network-outra';
        }
    };

    const colorClass = getColorClass(normalizedNetwork);

    switch (normalizedNetwork) {
        case 'meta':
            return <Facebook className={`${className} ${colorClass}`} />;
        case 'youtube':
            return <Youtube className={`${className} ${colorClass}`} />;
        case 'reddit':
            return <MessageSquare className={`${className} ${colorClass}`} />; // Usando MessageSquare no lugar de Reddit
        case 'tiktok':
            return <TrendingUp className={`${className} ${colorClass}`} />; 
        case 'google ads':
            return <Search className={`${className} ${colorClass}`} />; // Usando Search para Google Ads
        default:
            return <Globe className={`${className} ${colorClass}`} />;
    }
};

export default NetworkIcon;