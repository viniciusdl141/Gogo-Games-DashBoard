import { supabase } from './client';
import { Game as SupabaseGame } from './schema'; // Importa Game do schema e renomeia

// Define a estrutura mínima para um jogo, incluindo campos que podem ser atualizados
export interface GameOption {
    id: string;
    name: string;
    launch_date: string | null;
    suggested_price: number | null;
    capsule_image_url: string | null;
    category: string | null; // Adicionado 'category'
}

// Tipagem para os dados que podem ser atualizados
type GameUpdate = Partial<Omit<SupabaseGame, 'id' | 'created_at' | 'studio_id'>>;

// Função para buscar todos os jogos (opcionalmente filtrado por studioId)
export const getGames = async (studioId?: string | null): Promise<SupabaseGame[]> => {
    let query = supabase
        .from('games')
        .select('*');

    if (studioId) {
        // Filtra por studio_id, mas permite jogos sem studio_id (para admins ou jogos globais)
        query = query.or(`studio_id.eq.${studioId},studio_id.is.null`);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
        console.error("Error fetching games:", error);
        throw error;
    }

    return data || [];
};

// Função para adicionar um novo jogo
export const addGame = async (
    name: string, 
    launchDate: string | null, 
    suggestedPrice: number | null, 
    capsuleImageUrl: string | null,
    studioId: string | null,
    category: string | null = null, // Adicionado category
): Promise<SupabaseGame> => {
    const { data, error } = await supabase
        .from('games')
        .insert([
            { 
                name, 
                launch_date: launchDate, 
                suggested_price: suggestedPrice, 
                capsule_image_url: capsuleImageUrl,
                studio_id: studioId,
                category: category, // Adicionado category
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("Error adding game:", error);
        throw error;
    }

    return data;
};

// Função para atualizar um jogo existente
export const updateGame = async (gameId: string, updates: GameUpdate): Promise<SupabaseGame> => {
    const cleanUpdates: Partial<SupabaseGame> = {};
    
    // Filtra undefined/nulls para evitar sobrescrever valores acidentalmente, exceto se o valor for explicitamente null
    for (const k in updates) {
        const key = k as keyof GameUpdate;
        
        if (updates[key] !== undefined) {
            // Corrigido o erro 1: Usando Object.assign para evitar o erro de tipagem complexa no loop
            // Alternativamente, podemos usar um cast mais genérico, mas Object.assign é mais limpo aqui.
            (cleanUpdates as any)[key] = updates[key];
        }
    }

    const { data, error } = await supabase
        .from('games')
        .update(cleanUpdates)
        .eq('id', gameId)
        .select()
        .single();

    if (error) {
        console.error("Error updating game:", error);
        throw error;
    }

    return data;
};

// Função para deletar um jogo
export const deleteGame = async (gameId: string): Promise<void> => {
    const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

    if (error) {
        console.error("Error deleting game:", error);
        throw error;
    }
};

// Função para encontrar o melhor match entre a lista de jogos e uma opção de jogo
export const findBestGameMatch = (games: GameOption[], gameOption: GameOption): GameOption => {
    const bestMatch = games.find(g => g.name === gameOption.name);
    if (bestMatch) {
        return bestMatch;
    }
    return gameOption;
};

// Função para mesclar dados de jogos (usada em GameComparisonPanel)
export const mergeGameData = (game: GameOption, bestMatch: GameOption): GameOption => {
    return {
        id: game.id,
        name: game.name,
        launch_date: bestMatch.launch_date || game.launch_date,
        suggested_price: bestMatch.suggested_price || game.suggested_price,
        category: bestMatch.category || game.category, 
        capsule_image_url: bestMatch.capsule_image_url || game.capsule_image_url,
    };
};