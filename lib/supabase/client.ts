import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 🚀 Use the publishable key for direct database access with RLS (same as WagerFi)
const supabasePublishableKey = 'sb_publishable_dI7NJZOOwrzmXwk9ncLyCg_Gj_AHbUe';

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
        persistSession: false, // We don't need auth session for public data
        autoRefreshToken: false,
    },
    realtime: {
        params: {
            eventsPerSecond: 30, // Higher rate for performance
        },
    },
});

