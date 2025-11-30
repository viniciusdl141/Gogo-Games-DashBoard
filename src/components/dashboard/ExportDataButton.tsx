import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { convertToCSV } from '@/lib/utils';
import { toast } from 'sonner';

interface ExportDataButtonProps {
    data: any[];
    filename: string;
}

const ExportDataButton: React.FC<ExportDataButtonProps> = ({ data, filename }) => {
    const handleExport = () => {
        if (data.length === 0) {
            toast.info("Nenhum dado para exportar.");
            return;
        }

        try {
            const csv = convertToCSV(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${filename}_${new Date().toISOString().substring(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Dados exportados com sucesso!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Falha ao exportar dados.");
        }
    };

    return (
        <Button onClick={handleExport} variant="outline" size="sm" className="text-gogo-cyan border-gogo-cyan hover:bg-gogo-cyan/10">
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
    );
};

export default ExportDataButton;