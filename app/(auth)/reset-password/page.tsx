import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ResetPasswordForm } from './form';

export const metadata = {
  title: 'Reset password — My Best Selling Novel',
  description: 'Set a new password for your account.',
};

// Robust to two entry paths:
//   1. From the password-recovery email link via /auth/callback?next=/reset-password.
//      /auth/callback exchanges the recovery code for a session and sets cookies;
//      by the time this page runs, getUser() returns the user.
//   2. From an already-signed-in session (e.g., navigating here from a future
//      /account "Change password" link). Same result: getUser() returns the
//      user, the form renders, updateUser({ password }) updates the credential.
//
// In both cases the form is the same; the only check is "is a session present?".
// If not, send to /forgot to start over.
//
// Code exchange used to happen here (server component) before 2026-05-13; that
// silently dropped the session cookies and produced misleading "expired" errors
// at submit time. Now the exchange lives in /auth/callback (a Route Handler
// that can write cookies).

export default async function ResetPasswordPage() {
  const sb = createClient();
  const { data } = await sb.auth.getUser();

  if (!data.user) {
    redirect('/forgot');
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <ResetPasswordForm />
    </main>
  );
}
