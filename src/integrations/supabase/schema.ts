// Define a interface para a tabela 'games' no Supabase
export interface Game {
    id: string;
    name: string;
    launch_date: string | null;
    suggested_price: number | null;
    capsule_image_url: string | null;
    created_at: string;
    studio_id: string | null;
    category: string | null;
}

// Define a interface para a tabela 'studios' no Supabase
export interface Studio {
    id: string;
    name: string;
    created_at: string;
}