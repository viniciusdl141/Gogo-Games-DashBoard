"use client";

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addStudio } from '@/integrations/supabase/studios';
import { getStudios } from '@/integrations/supabase/studios';

const CreateDefaultStudio: React.FC = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const createDefaultStudio = async () => {
            try {
                // Verifica se já existe o estúdio padrão
                const existingStudios = await getStudios();
                const hasDefaultStudio = existingStudios.some(studio => 
                    studio.name === 'GoGo Games Interactive'
                );

                if (!hasDefaultStudio) {
                    // Cria o estúdio padrão
                    await addStudio('GoGo Games Interactive');
                    queryClient.invalidateQueries({ queryKey: ['studios'] });
                    toast.success('Estúdio "GoGo Games Interactive" criado automaticamente!');
                    console.log('Estúdio padrão criado com sucesso!');
                }
            } catch (error) {
                console.error('Erro ao criar estúdio padrão:', error);
                // Não exibe toast de erro para não incomodar o usuário
            }
        };

        createDefaultStudio();
    }, [queryClient]);

    return null; // Este componente não renderiza nada
};

export default CreateDefaultStudio;