'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Skeleton from './guards/Skeleton';

/**
 * Client-side authentication wrapper. Mount it inside a protected layout to:
 * - Hold the render behind a Skeleton while the session probe is in flight
 * - Bounce unauthenticated users to /signin?returnTo=<original> when probe
 *   returns no user, OR when an in-flight sign-out fires SIGNED_OUT
 *
 * Layered with TASK-007 middleware (server-side bounce on protected routes)
 * and server-helper requireAuth (route-handler-side); per Q-2.15 we keep
 * both layers — middleware handles initial navigation, AuthGuard handles
 * sign-out events that occur after the page is already loaded.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const sb = createClient();
    let active = true;

    sb.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) {
        setState('authenticated');
      } else {
        setState('unauthenticated');
        router.replace(`/signin?returnTo=${encodeURIComponent(pathname)}`);
      }
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        router.replace(`/signin?returnTo=${encodeURIComponent(pathname)}`);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (state === 'loading') return <Skeleton />;
  if (state === 'unauthenticated') return null;
  return <>{children}</>;
}
