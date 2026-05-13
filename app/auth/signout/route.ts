import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Minimal sign-out path used for Phase 2 smoke testing. TASK-010 will add the
// proper sign-out button in the authenticated nav; this route can stay or be
// folded into a Server Action then. GET is supported for convenience (operator
// can navigate to /auth/signout in the browser to clear their session); POST
// is also supported for future button-driven sign-outs.

async function handle(req: NextRequest) {
  const sb = createClient();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL('/signin?signedout=true', req.url));
}

export const GET = handle;
export const POST = handle;
