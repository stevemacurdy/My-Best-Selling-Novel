import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import * as Sentry from '@sentry/nextjs';
import { ResetPasswordForm } from './form';

export const metadata = {
  title: 'Reset password — My Best Selling Novel',
  description: 'Set a new password for your account.',
};

// PKCE recovery flow lands here from the email link as
//   /reset-password?code=<auth_code>
// The page exchanges the code for a recovery session BEFORE rendering the
// form so resetPasswordAction can call auth.updateUser against the just-
// established session. The user already has a verified identity by this
// point (Supabase consumed the recovery token before redirecting here);
// the code exchange is just turning that into a session cookie.

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string };
}) {
  // Surface Supabase-side errors (expired link, already used, etc.).
  if (searchParams.error) {
    redirect('/forgot?error=expired');
  }

  // No code → user landed here directly (not from an email). Send them back
  // to /forgot to start over rather than showing a form they can't submit.
  if (!searchParams.code) {
    redirect('/forgot');
  }

  const sb = createClient();
  const { error } = await sb.auth.exchangeCodeForSession(searchParams.code);

  if (error) {
    Sentry.captureException(error, {
      level: 'warning',
      tags: { surface: 'password_reset' },
      extra: { stage: 'exchangeCodeForSession' },
    });
    redirect('/forgot?error=expired');
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <ResetPasswordForm />
    </main>
  );
}
