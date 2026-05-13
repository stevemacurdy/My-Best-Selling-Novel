'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Skeleton from './guards/Skeleton';

interface AdminGuardProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

/**
 * Client-side admin authorization wrapper.
 *
 * Per Q-2.13 default, this is a single component with a `requireSuperAdmin`
 * boolean prop, not two components. Default behavior (no prop) lets admin
 * AND super_admin through; with `requireSuperAdmin`, only super_admin
 * passes.
 *
 * Per Q-2.14 default, AdminGuard auto-enforces MFA — except we use the
 * same vacuous-true semantics as lib/api-auth.ts (TASK-006): if the user
 * has no MFA factor enrolled (nextLevel === 'aal1'), treat them as
 * verified. Strict aal2 would bounce admins who haven't enrolled MFA to
 * /account/mfa, which doesn't exist until R-TASK-103 / Phase 11. Once the
 * MFA enrollment flow ships, the strict check can be re-enabled by
 * flipping the vacuous-true branch off.
 */
export default function AdminGuard({ children, requireSuperAdmin = false }: AdminGuardProps) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'allowed' | 'redirect'>('loading');

  useEffect(() => {
    const sb = createClient();
    let active = true;

    (async () => {
      const { data: userData } = await sb.auth.getUser();
      if (!active) return;
      if (!userData.user) {
        router.replace('/signin');
        setState('redirect');
        return;
      }

      const { data: aalData } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      const mfaVerified =
        aalData?.nextLevel === 'aal1' ? true : aalData?.currentLevel === 'aal2';
      if (!mfaVerified) {
        // The user has MFA enrolled but didn't challenge this session.
        // R-TASK-103 / Phase 11 builds /account/mfa.
        router.replace('/account/mfa');
        setState('redirect');
        return;
      }

      const { data: profile } = await sb
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single();

      const role = profile?.role;
      const allowed = requireSuperAdmin
        ? role === 'super_admin'
        : role === 'admin' || role === 'super_admin';

      if (!active) return;
      if (allowed) {
        setState('allowed');
      } else {
        router.replace('/');
        setState('redirect');
      }
    })();

    return () => {
      active = false;
    };
  }, [router, requireSuperAdmin]);

  if (state === 'loading') return <Skeleton />;
  if (state === 'redirect') return null;
  return <>{children}</>;
}
