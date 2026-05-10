import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isPublicPath } from '@/lib/middleware-helpers';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // TODO(R-TASK-104, Phase 11): per-IP rate limit on /signup, /api/signup, /api/signin
  // via @/lib/ratelimit. Lib not yet shipped.

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(url);
  }

  // Per Q-2.6: no x-user-* header forwarding. Routes re-call verifyToken.
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$).*)',
  ],
};
