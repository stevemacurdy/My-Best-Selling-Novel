import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as Sentry from '@sentry/nextjs';
import type { Database } from '@/types/supabase';

// Handles Supabase's PKCE redirect after the user clicks an email verification
// link (or, later, an OAuth provider redirect). The link looks like
//   <our-host>/auth/callback?code=<auth_code>
// We exchange the code for a session, which sets the session cookies via the
// @supabase/ssr cookies bridge, then redirect the user into the app.
//
// Marked public in lib/middleware-helpers.ts so unauthenticated callers
// (the user is, by definition, not yet signed in here) can reach this route.

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');

  if (!code) {
    Sentry.captureMessage('auth/callback: missing code param', {
      level: 'warning',
      tags: { surface: 'auth_callback' },
    });
    return NextResponse.redirect(new URL('/signin?error=verification_failed', req.url));
  }

  const cookieStore = cookies();
  const sb = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    },
  );

  const { error } = await sb.auth.exchangeCodeForSession(code);

  if (error) {
    Sentry.captureException(error, {
      level: 'warning',
      tags: { surface: 'auth_callback' },
      extra: { stage: 'exchangeCodeForSession' },
    });
    return NextResponse.redirect(new URL('/signin?error=verification_failed', req.url));
  }

  // TODO (Phase 5): redirect to /app once that route exists; for now, the landing page.
  return NextResponse.redirect(new URL('/', req.url));
}
