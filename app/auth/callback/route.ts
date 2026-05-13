import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as Sentry from '@sentry/nextjs';
import { safeRedirectPath } from '@/lib/auth-redirects';
import type { Database } from '@/types/supabase';

// Handles Supabase's PKCE redirect after the user clicks an email verification
// link, a password-recovery link, or (later) an OAuth provider redirect. The
// link looks like
//   <our-host>/auth/callback?code=<auth_code>[&next=<path>]
// We exchange the code for a session, which sets the session cookies via the
// @supabase/ssr cookies bridge, then redirect the user to `next` (sanitized)
// or '/' by default.
//
// Code exchange MUST happen in this Route Handler (not a Server Component)
// because only Route Handlers and Server Actions can write cookies in Next.js
// 14. A Server Component that called exchangeCodeForSession would consume the
// one-shot code but silently drop the resulting cookie writes — bit us during
// /reset-password debugging on 2026-05-13.
//
// Marked public in lib/middleware-helpers.ts so unauthenticated callers
// (the user is, by definition, not yet signed in here) can reach this route.

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');
  // TODO (Phase 5): change default to '/app' once that route exists.
  const next = safeRedirectPath(url.searchParams.get('next'));

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

  return NextResponse.redirect(new URL(next, req.url));
}
