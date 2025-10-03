export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: User;
                Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
                Relationships: []
            };
            crypto_wagers: {
                Row: CryptoWager;
                Insert: Omit<CryptoWager, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<CryptoWager, 'id' | 'created_at' | 'updated_at'>>;
                Relationships: []
            };
            sports_wagers: {
                Row: SportsWager;
                Insert: Omit<SportsWager, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<SportsWager, 'id' | 'created_at' | 'updated_at'>>;
                Relationships: []
            };
        };
        Views: {
            [_ in never]: never
        };
        Functions: {
            [_ in never]: never
        };
        Enums: {
            [_ in never]: never
        };
        CompositeTypes: {
            [_ in never]: never
        };
    };
}

export interface User {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
    wallet_address?: string;
    profile_image_url?: string;
    total_wagered: number;
    total_won: number;
    total_lost: number;
    win_rate: number;
    streak_count: number;
    created_at: string;
    updated_at: string;
}

export interface UserProfile {
    wallet_address: string;
    username: string;
    profile_image_url: string;
}

export interface CryptoWager {
    id: string;
    wager_id: string;
    creator_id: string;
    creator_address?: string;
    acceptor_id?: string;
    acceptor_address?: string;
    amount: number;
    token_symbol: string;
    prediction_type: 'above' | 'below';
    target_price: number;
    expiry_time: string;
    status: 'open' | 'active' | 'resolved' | 'cancelled' | 'expired';
    winner_id?: string;
    winner_position?: 'creator' | 'acceptor';
    resolution_price?: number;
    resolution_time?: string;
    on_chain_signature?: string;
    escrow_pda?: string;
    metadata?: Json;
    created_at: string;
    updated_at: string;
    creator_profile?: UserProfile | null;
    acceptor_profile?: UserProfile | null;
}

export interface SportsWager {
    id: string;
    wager_id: string;
    creator_id: string;
    creator_address?: string;
    acceptor_id?: string;
    acceptor_address?: string;
    amount: number;
    sport: string;
    league: string;
    team1: string;
    team2: string;
    prediction: string;
    game_time: string;
    expiry_time: string;
    status: 'open' | 'active' | 'resolved' | 'cancelled' | 'expired' | 'live';
    winner_id?: string;
    winner_position?: 'creator' | 'acceptor';
    resolution_outcome?: string;
    resolution_time?: string;
    on_chain_signature?: string;
    escrow_pda?: string;
    reserved_address?: string;
    metadata?: any;
    created_at: string;
    updated_at: string;
    creator_profile?: UserProfile | null;
    acceptor_profile?: UserProfile | null;
}

