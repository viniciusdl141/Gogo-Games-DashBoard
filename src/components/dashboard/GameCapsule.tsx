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
    const hasImage = !!imageUrl && imageUrl.trim() !== '';

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
                    // Fallback se a imagem falhar ao carregar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    
                    // Criar elemento de fallback
                    const parent = target.parentElement;
                    if (parent) {
                        parent.classList.add('flex', 'items-center', 'justify-center', 'bg-muted/50', 'border', 'border-dashed', 'text-muted-foreground');
                        parent.innerHTML = `
                            <div class="flex flex-col items-center text-center p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                    <circle cx="9" cy="9" r="2"/>
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                                </svg>
                                <span class="text-xs mt-1">Erro ao carregar</span>
                            </div>
                        `;
                    }
                }}
            />
        </div>
    );
};

export default GameCapsule;