"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { BookOpen, List, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { MethodDetails } from '@/lib/constants';
import { MethodResult } from '@/lib/estimation-logic';

interface MethodDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    methodResult: MethodResult;
    methodDetails: MethodDetails;
    onConfirmSelection: () => void;
}

const MethodDetailsModal: React.FC<MethodDetailsModalProps> = ({ 
    isOpen, 
    onClose, 
    methodResult, 
    methodDetails, 
    onConfirmSelection 
}) => {
    if (!methodResult || !methodDetails) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center text-gogo-orange">
                        <BookOpen className="h-5 w-5 mr-2" /> Detalhes do Método: {methodResult.method}
                    </DialogTitle>
                    <DialogDescription className="mt-2">
                        {methodDetails.description}
                    </DialogDescription>
                </DialogHeader>
                
                <Separator className="my-4" />

                <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gogo-cyan">Resultados Calculados</h4>
                    
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                        <span className="flex items-center text-sm font-medium text-muted-foreground">
                            <List className="h-4 w-4 mr-2 text-gogo-cyan" /> Vendas Estimadas:
                        </span>
                        <span className="text-lg font-bold text-gogo-cyan">
                            {formatNumber(methodResult.sales)}
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                        <span className="flex items-center text-sm font-medium text-muted-foreground">
                            <DollarSign className="h-4 w-4 mr-2 text-gogo-orange" /> Receita Líquida Estimada:
                        </span>
                        <span className="text-lg font-bold text-gogo-orange">
                            {formatCurrency(methodResult.revenue)}
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                        <span className="flex items-center text-sm font-medium text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2" /> Período Estimado:
                        </span>
                        <span className="text-sm font-medium text-foreground">
                            {methodResult.timeframe}
                        </span>
                    </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Fonte:</h4>
                    <p className="text-sm text-muted-foreground italic">{methodDetails.source}</p>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Fechar
                    </Button>
                    <Button 
                        onClick={onConfirmSelection} 
                        className="bg-gogo-cyan hover:bg-gogo-cyan/90"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" /> Selecionar Esta Estimativa
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MethodDetailsModal;