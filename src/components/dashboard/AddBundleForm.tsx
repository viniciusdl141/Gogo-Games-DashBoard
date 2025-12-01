"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

// Exportando o schema Zod para uso em WlDetailsManager
export const AddBundleFormSchema = z.object({
    name: z.string().min(1, "O nome do bundle é obrigatório."),
    bundleUnits: z.number().min(0, "Unidades do bundle devem ser positivas.").default(0),
    packageUnits: z.number().min(0, "Unidades do pacote devem ser positivas.").default(0),
    salesUSD: z.number().min(0, "Vendas em USD devem ser positivas.").default(0),
    xsolla: z.string().optional(),
});

type AddBundleFormValues = z.infer<typeof AddBundleFormSchema>;

interface AddBundleFormProps {
    onSave: (values: AddBundleFormValues) => void;
    onClose: () => void;
}

const AddBundleForm: React.FC<AddBundleFormProps> = ({ onSave, onClose }) => {
    const form = useForm<AddBundleFormValues>({
        resolver: zodResolver(AddBundleFormSchema),
        defaultValues: {
            name: '',
            bundleUnits: 0,
            packageUnits: 0,
            salesUSD: 0,
            xsolla: '',
        },
    });

    const onSubmit = (values: AddBundleFormValues) => {
        onSave(values);
        toast.success("Bundle adicionado com sucesso.");
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Bundle</FormLabel>
                            <FormControl>
                                <Input placeholder="Nome do Bundle" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="bundleUnits"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unidades do Bundle</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        {...field} 
                                        onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="packageUnits"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unidades do Pacote</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        placeholder="0" 
                                        {...field} 
                                        onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="salesUSD"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vendas (USD)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        placeholder="0.00" 
                                        step="0.01"
                                        {...field} 
                                        onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="xsolla"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Xsolla (Opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Valor Xsolla" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit">
                        Salvar Bundle
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default AddBundleForm;