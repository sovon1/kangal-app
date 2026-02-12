'use client';

import { createBrowserClient } from '@supabase/ssr';

function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// Singleton for browser-side usage
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
    if (!client) {
        client = createClient();
    }
    return client;
}
