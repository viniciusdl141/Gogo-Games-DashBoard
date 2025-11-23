"use client";

import React from 'react';
import { Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameCapsuleProps {
    imageUrl: string | null | undefined;
    gameName: string;
    className?: string;
}

const GameCapsule: React.FC<GameCapsuleProps> = ({ imageUrl, gameName, className }) => {
    if (!imageUrl) {
        return (
            <div className={cn("flex items-center justify-center bg-muted/50 rounded-lg border border-dashed text-muted-foreground", className)}>
                <Image className="h-6 w-6" />
            </div>
        );
    }

    return (
        <img 
            src={imageUrl} 
            alt={`Cápsula do jogo ${gameName}`} 
            className={cn("object-cover rounded-lg shadow-md", className)}
            onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
            }}
        />
    );
};

export default GameCapsule;