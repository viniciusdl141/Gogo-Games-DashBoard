"use client";

import React from 'react';
import { Image, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameCapsuleProps {
    imageUrl: string | null | undefined;
    gameName: string;
    className?: string;
    onClick?: () => void; // Novo prop para clique
}

const GameCapsule: React.FC<GameCapsuleProps> = ({ imageUrl, gameName, className, onClick }) => {
    const isClickable = !!onClick;
    const hasImage = !!imageUrl;

    const baseClasses = cn(
        "rounded-lg shadow-md transition-all duration-200",
        className,
        isClickable && "cursor-pointer",
        !hasImage && "flex items-center justify-center bg-muted/50 border border-dashed text-muted-foreground hover:bg-muted/80"
    );

    if (!hasImage) {
        return (
            <div className={baseClasses} onClick={onClick}>
                <div className="flex flex-col items-center text-center p-2">
                    <Image className="h-6 w-6" />
                    {isClickable && <span className="text-xs mt-1">Adicionar Imagem</span>}
                </div>
            </div>
        );
    }

    return (
        <div className={baseClasses} onClick={onClick}>
            <img 
                src={imageUrl} 
                alt={`Cápsula do jogo ${gameName}`} 
                className={cn("object-cover w-full h-full rounded-lg")}
                onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-muted/50', 'border', 'border-dashed', 'text-muted-foreground');
                    e.currentTarget.parentElement?.innerHTML = `<div class="flex flex-col items-center text-center p-2"><Image class="h-6 w-6" /><span class="text-xs mt-1">Erro ao carregar</span></div>`;
                }}
            />
        </div>
    );
};

export default GameCapsule;