import { SupabaseClient, createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

function getSupabaseClient(): SupabaseClient {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided.');
    }

    // Agent only uses local execution; using service_role is completely secure on the backend terminal
    process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined;

    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
}

let client: SupabaseClient | null = null;

export const db: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop, _receiver) {
        if (!client) {
            client = getSupabaseClient();
        }
        const value = Reflect.get(client, prop, client);
        return typeof value === 'function' ? value.bind(client) : value;
    },
});
