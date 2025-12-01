"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Definindo tipos para variant e size (assumindo que são strings para compatibilidade com Button)
type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface DeleteGameButtonProps {
    gameId: string;
    gameName: string;
    onDelete: (gameId: string) => Promise<void>;
    variant?: ButtonVariant;
    size?: ButtonSize;
}

const DeleteGameButton: React.FC<DeleteGameButtonProps> = ({ gameId, gameName, onDelete, variant = 'destructive', size = 'default' }) => {
    const handleDelete = async () => {
        await onDelete(gameId);
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant={variant} size={size} className={size === 'sm' || size === 'icon' ? 'h-8 w-8 p-0' : ''}>
                    <Trash2 className="h-4 w-4" />
                    {(size !== 'sm' && size !== 'icon') && <span className="ml-2">Excluir Jogo</span>}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza que deseja excluir {gameName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação é irreversível. Todos os dados de tracking e metadados do jogo serão removidos.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Excluir Permanentemente
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteGameButton;