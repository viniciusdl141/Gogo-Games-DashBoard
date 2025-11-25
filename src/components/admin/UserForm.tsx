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
import { Studio } from '@/integrations/supabase/studios';
import { invokeAdminCreateUser } from '@/integrations/supabase/functions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    email: z.string().email("Email inválido."),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
    studioId: z.string().uuid("Selecione um estúdio válido."),
});

type UserFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
    studios: Studio[];
    onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ studios, onClose }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    
    const form = useForm<UserFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
            studioId: studios[0]?.id || '',
        },
    });

    const onSubmit = async (values: UserFormValues) => {
        setIsLoading(true);
        try {
            await invokeAdminCreateUser(values.email, values.password, values.studioId);
            toast.success(`Usuário ${values.email} criado e atribuído ao estúdio.`);
            onClose();
        } catch (error) {
            console.error("Error creating user:", error);
            toast.error(`Falha ao criar usuário: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email do Usuário</FormLabel>
                            <FormControl>
                                <Input placeholder="usuario@estudio.com" {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="studioId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estúdio</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || studios.length === 0}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o estúdio" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {studios.map(studio => (
                                        <SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            'Criar Usuário'
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default UserForm;