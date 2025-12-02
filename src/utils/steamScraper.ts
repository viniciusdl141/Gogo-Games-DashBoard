import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

// Define a estrutura esperada da Edge Function Gemini
interface StructuredGameData {
  appId?: string;
  name: string;
  wishlistDelta?: number;
  followers?: number;
  tags?: string[];
  reviews?: string;
  owners?: string;
  price?: number; // Mapeia para price_usd
  releaseDate?: string; // Mapeia para launch_date
}

export interface StructuredResponse {
    games: StructuredGameData[];
}

// Função auxiliar para mapear dados estruturados para o esquema DB
const mapToDbSchema = (game: StructuredGameData) => {
    const dbData: Record<string, any> = {
        name: game.name,
    };

    if (game.price !== undefined) {
        dbData.price_usd = game.price;
    }
    if (game.reviews) {
        dbData.review_summary = game.reviews;
    }
    if (game.releaseDate) {
        // Mapeando releaseDate para launch_date na tabela games
        dbData.launch_date = game.releaseDate;
    }
    
    // Campos como wishlistDelta, followers, tags, owners não são mapeados 
    // pois não existem no esquema atual da tabela 'games'.
    
    return dbData;
};

/**
 * Chama a Edge Function para processar o JSON bruto e atualiza/cria registros de jogos.
 * @param rawJson O JSON bruto do Steam Scraper.
 * @param apiKey A Chave da API Gemini.
 * @returns A resposta JSON estruturada da IA.
 */
export async function processSteamScraperJson(rawJson: string, apiKey: string): Promise<StructuredResponse> {
    const toastId = toast.loading('Processando JSON com IA...');
    
    try {
        // 1. Chamar a Edge Function
        const edgeFunctionUrl = 'https://ynlebwtutvyxybqgupke.supabase.co/functions/v1/process-steam-scraper-json';
        
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ json: rawJson, apiKey }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao processar JSON via Edge Function.');
        }

        const structuredResponse: StructuredResponse = await response.json();
        
        if (!structuredResponse.games || structuredResponse.games.length === 0) {
            toast.dismiss(toastId);
            toast.success('Processamento concluído, mas nenhum jogo estruturado foi encontrado.');
            return structuredResponse;
        }

        // 2. Processar jogos estruturados e atualizar/inserir no DB
        let updatedCount = 0;
        let createdCount = 0;

        for (const game of structuredResponse.games) {
            const dbData = mapToDbSchema(game);
            
            // Tentar encontrar jogo existente pelo nome
            const { data: existingGames, error: fetchError } = await supabase
                .from('games')
                .select('id')
                .eq('name', game.name)
                .limit(1);

            if (fetchError) {
                console.error(\`Erro ao buscar jogo \${game.name}:\`, fetchError);
                continue;
            }

            if (existingGames && existingGames.length > 0) {
                // Atualizar jogo existente
                const gameId = existingGames[0].id;
                const { error: updateError } = await supabase
                    .from('games')
                    .update(dbData)
                    .eq('id', gameId);

                if (updateError) {
                    console.error(\`Erro ao atualizar jogo \${game.name}:\`, updateError);
                } else {
                    updatedCount++;
                }
            } else {
                // Inserir novo jogo
                const { error: insertError } = await supabase
                    .from('games')
                    .insert([dbData]);

                if (insertError) {
                    console.error(\`Erro ao inserir novo jogo \${game.name}:\`, insertError);
                } else {
                    createdCount++;
                }
            }
        }

        toast.dismiss(toastId);
        toast.success(\`Processamento concluído! \${updatedCount} jogos atualizados, \${createdCount} jogos criados.\`);
        
        return structuredResponse;

    } catch (error) {
        toast.dismiss(toastId);
        toast.error(\`Erro: \${error.message}\`);
        throw error;
    }
}