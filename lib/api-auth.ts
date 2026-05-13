import type { NextRequest } from 'next/server';
import { createClient as createBareClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';
import type { Database } from '@/types/supabase';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  mfa_verified: boolean;
  subscription_tier: 'explorer' | 'author' | 'publisher';
  subscription_status: 'free' | 'active' | 'past_due' | 'cancelled';
}

type AuthFailure = { authorized: false; error: string; status: number };
type AuthSuccess = { authorized: true; user: AuthUser };

function extractBearer(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer (.+)$/.exec(header);
  return match?.[1]?.trim() || null;
}

function clientForToken(token: string) {
  return createBareClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
}

export async function verifyToken(req: NextRequest): Promise<AuthUser | null> {
  const token = extractBearer(req);
  if (!token) return null;

  const sb = clientForToken(token);

  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  if (userErr || !userData.user) return null;
  const authUser = userData.user;

  // AAL → mfa_verified semantics (Q-2.1):
  //   nextLevel === 'aal1' → no MFA enrolled → vacuously verified
  //   currentLevel === 'aal2' → MFA challenged in this session → verified
  //   else (enrolled, not challenged this session) → not verified
  const { data: aalData } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  const mfa_verified =
    aalData?.nextLevel === 'aal1' ? true : aalData?.currentLevel === 'aal2';

  // profiles table comes from TASK-011; until that migration lands, this query
  // errors with "relation does not exist". That's expected pre-Phase-3 — once
  // migrations apply, the row lookup works without code change.
  const { data: profile, error: profileErr } = await sb
    .from('profiles')
    .select('id, email, full_name, role, subscription_tier, subscription_status')
    .eq('id', authUser.id)
    .single();

  if (profileErr || !profile) {
    // Race window between auth.signUp() and the profile-creation trigger,
    // OR (pre-Phase-3) the profiles table doesn't exist yet. Either way,
    // treat as unauthenticated; surface to Sentry so sustained occurrences
    // get attention.
    Sentry.captureMessage('verifyToken: profile row missing for authenticated user', {
      level: 'warning',
      extra: { userId: authUser.id, supabaseError: profileErr?.message },
    });
    return null;
  }

  const p = profile as {
    id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    subscription_tier: AuthUser['subscription_tier'];
    subscription_status: AuthUser['subscription_status'];
  };

  return {
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    role: p.role,
    mfa_verified,
    subscription_tier: p.subscription_tier,
    subscription_status: p.subscription_status,
  };
}

export async function verifyAdmin(req: NextRequest): Promise<AuthSuccess | AuthFailure> {
  const user = await verifyToken(req);
  if (!user) return { authorized: false, error: 'unauthenticated', status: 401 };
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return { authorized: false, error: 'forbidden', status: 403 };
  }
  if (!user.mfa_verified) {
    return { authorized: false, error: 'mfa_required', status: 403 };
  }
  return { authorized: true, user };
}

export async function verifySuperAdmin(
  req: NextRequest,
): Promise<AuthSuccess | AuthFailure> {
  const user = await verifyToken(req);
  if (!user) return { authorized: false, error: 'unauthenticated', status: 401 };
  if (user.role !== 'super_admin') {
    return { authorized: false, error: 'forbidden', status: 403 };
  }
  if (!user.mfa_verified) {
    return { authorized: false, error: 'mfa_required', status: 403 };
  }
  return { authorized: true, user };
}

/**
 * Server helpers that throw a Response on failure (Next.js route handlers
 * catch the throw and return the Response as the HTTP response). Lets call
 * sites unwrap the success case linearly:
 *
 *   const user = await requireAdmin(req);
 *   // user is AuthUser; we wouldn't be here if not
 *
 * Per Q-2.15 these complement the client-side <AuthGuard>/<AdminGuard>
 * wrappers; the guards handle UX (skeleton + redirect), the server helpers
 * enforce the security boundary independently.
 */
export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await verifyToken(req);
  if (!user) throw new Response(null, { status: 401 });
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const result = await verifyAdmin(req);
  if (!result.authorized) {
    throw new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return result.user;
}

export async function requireSuperAdmin(req: NextRequest): Promise<AuthUser> {
  const result = await verifySuperAdmin(req);
  if (!result.authorized) {
    throw new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return result.user;
}
