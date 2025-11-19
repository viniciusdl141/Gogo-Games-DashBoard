"use client";

import React from 'react';
import { Game } from '@/data/gameData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GameListProps {
    games: Game[];
    onToggleBuySelection: (id: string) => void;
}

const statusMap: Record<Game['status'], string> = {
    'Upcoming': 'Próximo',
    'Released': 'Lançado',
    'Wishlist': 'Desejo',
};

const statusColorMap: Record<Game['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
    'Upcoming': 'secondary',
    'Released': 'default',
    'Wishlist': 'outline',
};

const GameList: React.FC<GameListProps> = ({ games, onToggleBuySelection }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rastreamento de Jogos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Comprar</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Publisher</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Preço (R$)</TableHead>
                <TableHead className="text-center">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>
                    <Checkbox
                      checked={game.isBuySelected}
                      onCheckedChange={() => onToggleBuySelection(game.id)}
                      aria-label={`Selecionar ${game.name} para compra`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{game.name}</TableCell>
                  <TableCell>{game.publisher}</TableCell>
                  <TableCell>
                    <Badge variant={statusColorMap[game.status]}>
                        {statusMap[game.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {game.price.toFixed(2).replace('.', ',')}
                  </TableCell>
                  <TableCell className="text-center">
                    {game.score > 0 ? game.score : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameList;