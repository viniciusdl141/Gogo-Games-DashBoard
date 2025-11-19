"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Game, generateNewGameId } from '@/data/gameData';
import { showSuccess } from '@/utils/toast';

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  publisher: z.string().min(2, { message: "A publisher deve ter pelo menos 2 caracteres." }),
  status: z.enum(['Upcoming', 'Released', 'Wishlist']),
  price: z.coerce.number().min(0, { message: "O preço deve ser positivo." }),
  score: z.coerce.number().min(0).max(100).optional(),
});

type AddGameFormValues = z.infer<typeof formSchema>;

interface AddGameFormProps {
    onAddGame: (game: Game) => void;
}

const AddGameForm: React.FC<AddGameFormProps> = ({ onAddGame }) => {
  const form = useForm<AddGameFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      publisher: "",
      status: "Upcoming",
      price: 0,
      score: 0,
    },
  });

  const onSubmit = (values: AddGameFormValues) => {
    const newGame: Game = {
      id: generateNewGameId(),
      name: values.name,
      publisher: values.publisher,
      status: values.status,
      price: values.price,
      score: values.score || 0,
      isBuySelected: false,
    };
    onAddGame(newGame);
    form.reset();
    showSuccess(`Jogo '${newGame.name}' adicionado com sucesso!`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Adicionar Novo Jogo</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Jogo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: God of War Ragnarok" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="publisher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publisher</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sony Interactive" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
                <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="79.99" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Score (0-100)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="85" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Upcoming">Próximo Lançamento</SelectItem>
                        <SelectItem value="Released">Lançado</SelectItem>
                        <SelectItem value="Wishlist">Lista de Desejos</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <Button type="submit" className="w-full">
              Adicionar Jogo
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddGameForm;