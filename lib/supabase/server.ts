import { createServerClient } from '@supabase/ssr';
import { createClient as createBareClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export type { SupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // server component: cookies are immutable; middleware refreshes the token
          }
        },
      },
    },
  );
}

/**
 * Service-role client. Bypasses RLS — bypasses every per-user check.
 * USE ONLY in:
 *   - app/api/stripe/webhook/route.ts (Decision #3 — webhook is sole source of truth for tier)
 *   - app/api/cron/* (cron jobs that aggregate across users)
 * NEVER use in user-facing routes or client components.
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  return createBareClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
