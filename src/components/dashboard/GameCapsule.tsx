"use client";

import React, { useState, useEffect } from 'react';
import { Image, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameCapsuleProps {
    imageUrl: string | null | undefined;
    gameName: string;
    className?: string;
    onClick?: () => void; // Novo prop para clique
}

const GameCapsule: React.FC<GameCapsuleProps> = ({ imageUrl, gameName, className, onClick }) => {
    const [imageError, setImageError] = useState(false);
    
    // Reset error state if imageUrl changes
    useEffect(() => {
        setImageError(false);
    }, [imageUrl]);

    const isClickable = !!onClick;
    const hasValidImage = !!imageUrl && !imageError;

    const baseClasses = cn(
        "rounded-lg shadow-md transition-all duration-200 overflow-hidden",
        className,
        isClickable && "cursor-pointer",
        !hasValidImage && "flex items-center justify-center bg-muted/50 border border-dashed text-muted-foreground hover:bg-muted/80"
    );

    const handleImageError = () => {
        setImageError(true);
    };

    if (!hasValidImage) {
        return (
            <div className={baseClasses} onClick={onClick}>
                <div className="flex flex-col items-center text-center p-2">
                    <Image className="h-6 w-6" />
                    <span className="text-xs mt-1">{isClickable ? 'Adicionar Imagem' : 'Sem Imagem'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={baseClasses} onClick={onClick}>
            <img 
                src={imageUrl} 
                alt={`Cápsula do jogo ${gameName}`} 
                className={cn("object-cover w-full h-full rounded-lg", className)}
                onError={handleImageError}
            />
        </div>
    );
};

export default GameCapsule;