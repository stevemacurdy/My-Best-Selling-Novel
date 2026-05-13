'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resetPasswordAction, type ResetPasswordError } from './actions';
import { PasswordInput } from '@/components/PasswordInput';

const ERROR_COPY: Record<ResetPasswordError, React.ReactNode> = {
  password_too_short: 'Password must be at least 12 characters.',
  passwords_dont_match: 'Passwords don’t match.',
  password_breached:
    'This password appears in known data breaches. Please choose a different one.',
  no_session: (
    <>
      Your reset link has expired or is no longer valid.{' '}
      <Link href="/forgot" className="underline">
        Request a new one
      </Link>
      .
    </>
  ),
  reset_failed: (
    <>
      Something went wrong. Please try again, or{' '}
      <Link href="/help" className="underline">
        contact support
      </Link>
      .
    </>
  ),
};

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<ResetPasswordError | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (result.ok) {
        router.replace('/signin?reset=true');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      action={onSubmit}
      className="w-full max-w-md mx-auto p-8 rounded-lg bg-brand-navyLight"
    >
      <h1 className="text-3xl mb-6">Set a new password</h1>

      <label className="block mb-4">
        <span className="block text-sm mb-1">New password</span>
        <PasswordInput name="password" required minLength={12} autoComplete="new-password" />
        <span className="block text-xs mt-1 text-brand-textSubtle">
          Minimum 12 characters. Checked against known breaches.
        </span>
      </label>

      <label className="block mb-6">
        <span className="block text-sm mb-1">Confirm new password</span>
        <PasswordInput name="confirm" required minLength={12} autoComplete="new-password" />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 rounded bg-brand-gold text-brand-navy font-semibold hover:bg-brand-goldDim disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Updating…' : 'Update password'}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-4 p-3 rounded text-brand-error bg-brand-errorBg/20 text-sm"
        >
          {ERROR_COPY[error]}
        </p>
      )}
    </form>
  );
}
