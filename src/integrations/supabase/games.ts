import { supabase } from './client';
import { GameMetrics } from '@/data/trackingData';
import { toast } from 'sonner';

// Define the structure for game options returned by the fetcher function
export interface GameOption {
    name: string;
    launchDate: string | null;
    suggestedPrice: number | null;
    capsuleImageUrl: string | null;
    category: string | null;
    developer: string | null;
    publisher: string | null;
    priceUSD: number | null;
    reviewSummary: string | null;
}

/**
 * Fetches all games associated with the current studio ID.
 * @param studioId The ID of the studio.
 * @returns A promise that resolves to an array of GameMetrics or null on error.
 */
export async function fetchGamesByStudio(studioId: string): Promise<GameMetrics[] | null> {
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('studio_id', studioId);

    if (error) {
        console.error('Error fetching games:', error);
        toast.error('Falha ao carregar jogos.');
        return null;
    }

    return data as GameMetrics[];
}

/**
 * Updates the details of a specific game in the database.
 * @param gameId The ID of the game to update.
 * @param updates The fields to update.
 * @returns A promise that resolves to the updated GameMetrics or null on error.
 */
export async function updateGameDetails(gameId: string, updates: Partial<GameMetrics>): Promise<GameMetrics | null> {
    const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single();

    if (error) {
        console.error('Error updating game details:', error);
        toast.error('Falha ao atualizar detalhes do jogo.');
        return null;
    }

    return data as GameMetrics;
}

/**
 * Updates game details based on a best match from external data.
 * This function is used after fetching data from the web search function.
 * @param game The existing game metrics.
 * @param bestMatch The best matching game option from the search.
 * @returns The updated GameMetrics object.
 */
export async function updateGameWithBestMatch(game: GameMetrics, bestMatch: GameOption): Promise<GameMetrics | null> {
    const updates: Partial<GameMetrics> = {
        launch_date: bestMatch.launchDate || game.launch_date,
        suggested_price: bestMatch.suggestedPrice || game.suggested_price,
        category: bestMatch.category || game.category,
        // We don't update developer/publisher/priceUSD here as they are not stored in the main Game table,
        // but we keep the structure flexible for future changes.
    };

    // Clean up updates object to remove undefined values
    const cleanUpdates: Partial<GameMetrics> = {};
    for (const k in updates) {
        const key = k as keyof Partial<GameMetrics>;
        if (updates[key] !== undefined) {
            // We must ensure the value is assignable to the property type.
            cleanUpdates[key] = updates[key] as any; 
        }
    }

    if (Object.keys(cleanUpdates).length === 0) {
        toast.info('Nenhuma informação nova para atualizar.');
        return game;
    }

    return updateGameDetails(game.id, cleanUpdates);
}

/**
 * Adds a new game to the database.
 * @param name The name of the new game.
 * @param studioId The ID of the studio owning the game.
 * @returns A promise that resolves to the new GameMetrics or null on error.
 */
export async function addGame(name: string, studioId: string): Promise<GameMetrics | null> {
    const { data, error } = await supabase
        .from('games')
        .insert({ name, studio_id: studioId })
        .select()
        .single();

    if (error) {
        console.error('Error adding game:', error);
        toast.error('Falha ao adicionar novo jogo.');
        return null;
    }

    return data as GameMetrics;
}

/**
 * Deletes a game from the database.
 * @param gameId The ID of the game to delete.
 * @returns A promise that resolves to true on success or false on error.
 */
export async function deleteGame(gameId: string): Promise<boolean> {
    const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

    if (error) {
        console.error('Error deleting game:', error);
        toast.error('Falha ao deletar jogo.');
        return false;
    }

    return true;
}