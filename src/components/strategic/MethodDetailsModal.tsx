"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { BookOpen, Calculator, Check } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface MethodResult {
    sales: number;
    revenue: number;
    method: string;
    timeframe: string;
}

interface MethodDetails {
    label: string;
    description: string;
    source: string;
}

interface MethodDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    methodResult: MethodResult;
    methodDetails: MethodDetails;
    onConfirmSelection: () => void;
}

const MethodDetailsModal: React.FC<MethodDetailsModalProps> = ({ isOpen, onClose, methodResult, methodDetails, onConfirmSelection }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-gogo-orange">
                        <BookOpen className="h-5 w-5 mr-2" /> Detalhes do Método: {methodDetails.label}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 p-4">
                    <h3 className="text-lg font-bold text-gogo-cyan">Resultado da Estimativa</h3>
                    <div className="grid grid-cols-2 gap-4 p-3 border rounded-lg bg-muted/50">
                        <div>
                            <p className="text-sm text-muted-foreground">Vendas Estimadas:</p>
                            <p className="text-xl font-bold text-gogo-cyan">{formatNumber(methodResult.sales)} un.</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Receita Líquida Estimada:</p>
                            <p className="text-xl font-bold text-gogo-orange">{formatCurrency(methodResult.revenue)}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">Ciclo de Vida Estimado:</p>
                            <p className="font-medium">{methodResult.timeframe}</p>
                        </div>
                    </div>

                    <Separator />

                    <h3 className="text-lg font-bold text-gogo-cyan">Análise e Referências</h3>
                    <p className="text-sm leading-relaxed">
                        {methodDetails.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                    </p>
                    <p className="text-sm italic text-muted-foreground mt-2">
                        {methodDetails.source}
                    </p>

                    <Separator />

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Voltar à Calculadora
                        </Button>
                        <Button 
                            onClick={onConfirmSelection} 
                            className="bg-gogo-orange hover:bg-gogo-orange/90"
                        >
                            <Check className="h-4 w-4 mr-2" /> Confirmar Seleção (Jogo 2)
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MethodDetailsModal;