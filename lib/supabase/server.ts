import { createServerClient } from '@supabase/ssr';
import { createClient as createBareClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import * as Sentry from '@sentry/nextjs';
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
          // Empty arrays are common (supabase-js calls setAll([]) defensively
          // when the in-memory session needs no persistence). Skip the try and
          // skip the signal — nothing was actually dropped.
          if (cookiesToSet.length === 0) return;

          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // Server-component context: cookies are immutable. The middleware
            // normally refreshes the session on the next request — but when a
            // code exchange (signup verification, password recovery, OAuth)
            // tries to write the FIRST session cookies from a Server Component,
            // those writes vanish here and downstream Server Actions see no
            // session. This pattern bit us twice during Phase 2 (signup
            // acceptance, password reset). Surface it so future code-exchange
            // surfaces get caught before users do.
            Sentry.captureMessage(
              'server_cookie_swallow: dropped session cookie writes from a Server Component',
              {
                level: 'warning',
                tags: { surface: 'server_cookie_swallow' },
                extra: { droppedCount: cookiesToSet.length },
              },
            );
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
