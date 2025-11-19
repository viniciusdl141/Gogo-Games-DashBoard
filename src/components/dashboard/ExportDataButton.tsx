"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { convertToCSV } from '@/lib/utils';
import { toast } from 'sonner';

interface ExportDataButtonProps<T> {
    data: T[];
    filename: string;
    label: string;
}

const ExportDataButton = <T extends Record<string, any>>({ data, filename, label }: ExportDataButtonProps<T>) => {
    const handleExport = () => {
        if (data.length === 0) {
            toast.error(`Não há dados de ${label} para exportar.`);
            return;
        }
        try {
            // For safety and consistency, let's ensure we pass a clean array.
            const cleanedData = data.map(item => {
                const cleanedItem: Record<string, any> = {};
                for (const key in item) {
                    if (item.hasOwnProperty(key)) {
                        let value = item[key];
                        // Skip complex objects that shouldn't be in CSV (like internal IDs if they are not strings)
                        if (key === 'id' && typeof value !== 'string') continue;
                        
                        cleanedItem[key] = value;
                    }
                }
                return cleanedItem;
            });

            convertToCSV(cleanedData, filename);
            toast.success(`Dados de ${label} exportados com sucesso!`);
        } catch (error) {
            console.error("Export failed:", error);
            toast.error(`Falha ao exportar dados de ${label}.`);
        }
    };

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport} 
            disabled={data.length === 0}
            className="text-sm"
        >
            <Download className="h-4 w-4 mr-2" /> Exportar {label}
        </Button>
    );
};

export default ExportDataButton;