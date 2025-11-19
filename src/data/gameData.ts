export interface Game {
  id: string;
  name: string;
  publisher: string;
  status: 'Upcoming' | 'Released' | 'Wishlist';
  price: number;
  score: number; // e.g., Metacritic or internal rating (0 if not applicable)
  isBuySelected: boolean;
}

const initialGames: Game[] = [
  { id: 'g1', name: 'Cyberpunk 2077: Phantom Liberty', publisher: 'CD Projekt', status: 'Released', price: 59.99, score: 90, isBuySelected: false },
  { id: 'g2', name: 'Elden Ring DLC', publisher: 'Bandai Namco', status: 'Upcoming', price: 39.99, score: 0, isBuySelected: false },
  { id: 'g3', name: 'Starfield', publisher: 'Bethesda', status: 'Released', price: 69.99, score: 86, isBuySelected: false },
  { id: 'g4', name: 'Hades II', publisher: 'Supergiant Games', status: 'Wishlist', price: 29.99, score: 0, isBuySelected: false },
  { id: 'g5', name: 'The Witcher 4', publisher: 'CD Projekt', status: 'Upcoming', price: 79.99, score: 0, isBuySelected: false },
];

export const getInitialGames = (): Game[] => initialGames;

let nextId = initialGames.length + 1;

export const generateNewGameId = (): string => {
    return `g${nextId++}`;
}