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

// Schema de validação
const formSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório."),
    bundleUnits: z.number().min(0).default(0),
    packageUnits: z.number().min(0).default(0),
    salesUSD: z.number().min(0).default(0),
    xsolla: z.number().min(0).default(0).optional(),
});

type BundleFormValues = z.infer<typeof formSchema>;

interface AddBundleFormProps {
    gameName: string;
    onSave: (data: BundleFormValues) => void;
    onClose: () => void;
}

const AddBundleForm: React.FC<AddBundleFormProps> = ({ gameName, onSave, onClose }) => {
    const form = useForm<BundleFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            bundleUnits: 0,
            packageUnits: 0,
            salesUSD: 0,
            xsolla: 0,
        },
    });

    const onSubmit = (values: BundleFormValues) => {
        onSave(values);
        toast.success(`Nova entrada de Bundle/DLC adicionada para ${gameName}.`);
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <h3 className="text-lg font-semibold">Adicionar Venda de Bundle/DLC</h3>
                
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Bundle/DLC</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Deluxe Edition Bundle" {...field} />
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
                                <FormLabel>Unidades Bundle</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                                <FormLabel>Unidades Package</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                                <FormLabel>Total Xsolla (Opcional)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" className="bg-gogo-cyan hover:bg-gogo-cyan/90">Salvar Bundle</Button>
                </div>
            </form>
        </Form>
    );
};

export default AddBundleForm;