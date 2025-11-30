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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InfluencerTrackingEntry } from '@/data/trackingData';
import { toast } from 'sonner';

// Schema de validação (Deve ser o mesmo do AddForm)
const formSchema = z.object({
    id: z.string(),
    game: z.string().min(1, "O jogo é obrigatório."),
    date: z.string().min(1, "A data é obrigatória (formato YYYY-MM-DD)."),
    influencer: z.string().min(1, "O nome do influencer é obrigatório."),
    platform: z.string().min(1, "A plataforma é obrigatória."),
    action: z.string().min(1, "A ação é obrigatória."),
    contentType: z.string().min(1, "O tipo de conteúdo é obrigatório."),
    views: z.number().min(0, "Views deve ser um número positivo.").default(0),
    investment: z.number().min(0, "Investimento deve ser um número positivo.").default(0),
    estimatedWL: z.number().min(0, "WL Estimadas deve ser um número positivo.").default(0),
    observations: z.string().optional(),
});

type InfluencerFormValues = z.infer<typeof formSchema>;

interface EditInfluencerFormProps {
    games: string[];
    entry: InfluencerTrackingEntry;
    onSave: (data: InfluencerTrackingEntry) => void;
    onClose: () => void;
}

const platforms = ['Youtube', 'Tiktok', 'Instagram', 'Facebook', 'Twitch', 'Outro'];
const contentTypes = ['Análise e recomendação', 'GamePlay', 'Video Curto', 'Live', 'Shorts', 'Reels', 'Outro'];
const actions = ['Video', 'Live', 'Shorts', 'Reels', 'Comentarios + CTA', 'Review', 'Outro'];

const EditInfluencerForm: React.FC<EditInfluencerFormProps> = ({ games, entry, onSave, onClose }) => {
    const defaultDate = entry.date ? entry.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const form = useForm<InfluencerFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: entry.id,
            game: entry.game,
            date: defaultDate,
            influencer: entry.influencer,
            platform: entry.platform,
            action: entry.action,
            contentType: entry.contentType,
            views: entry.views,
            investment: entry.investment,
            estimatedWL: entry.estimatedWL,
            observations: entry.observations || '',
        },
    });

    const onSubmit = (values: InfluencerFormValues) => {
        const dateObject = new Date(values.date);
        const roiValue = values.estimatedWL > 0 ? values.investment / values.estimatedWL : '-';

        onSave({
            ...values,
            date: dateObject,
            roi: roiValue,
        } as InfluencerTrackingEntry);
        toast.success("Entrada de influencer atualizada.");
        onClose();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <FormField
                    control={form.control}
                    name="game"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Jogo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o jogo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {games.map(game => (
                                        <SelectItem key={game} value={game}>{game}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data (YYYY-MM-DD)</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="influencer"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Influencer</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome do Influencer" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="platform"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Plataforma</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Plataforma" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {platforms.map(p => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="action"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ação Realizada</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Ação" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {actions.map(a => (
                                            <SelectItem key={a} value={a}>{a}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contentType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Conteúdo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tipo de Conteúdo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {contentTypes.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="views"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Visualizações Alcançadas</FormLabel>
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
                        name="investment"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Investimento (R$)</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="0.00" 
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
                        name="estimatedWL"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>WL Estimadas</FormLabel>
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

                <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Notas adicionais" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" className="bg-gogo-cyan hover:bg-gogo-cyan/90">
                        Salvar Alterações
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default EditInfluencerForm;