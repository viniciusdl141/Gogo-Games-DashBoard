export interface Profile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    is_admin: boolean;
    studio_id: string | null;
    is_approved: boolean; // NEW
}

export interface Studio {
    id: string;
    name: string;
    owner_id: string | null;
}