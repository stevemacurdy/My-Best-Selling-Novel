'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { forgotAction, type ForgotError } from './actions';

const ERROR_COPY: Record<ForgotError, React.ReactNode> = {
  email_required: 'Please enter your email.',
  rate_limit: 'Too many requests. Please try again in an hour.',
  forgot_failed: (
    <>
      Something went wrong. Please try again, or{' '}
      <Link href="/help" className="underline">
        contact support
      </Link>
      .
    </>
  ),
};

export function ForgotForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<ForgotError | null>(null);
  const [sent, setSent] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await forgotAction(formData);
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (sent) {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-lg bg-brand-navyLight">
        <h1 className="text-3xl mb-4">Check your inbox</h1>
        <p className="mb-6">
          If an account exists for that email, a reset link has been sent. Check your inbox.
        </p>
        <p className="text-sm text-brand-textSubtle">
          <Link href="/signin" className="underline text-brand-white">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      action={onSubmit}
      className="w-full max-w-md mx-auto p-8 rounded-lg bg-brand-navyLight"
    >
      <h1 className="text-3xl mb-2">Reset your password</h1>
      <p className="text-sm text-brand-textSubtle mb-6">
        Enter your email and we&rsquo;ll send a reset link.
      </p>

      <label className="block mb-6">
        <span className="block text-sm mb-1">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-3 py-2 rounded bg-brand-navyDeep text-brand-white border border-brand-borderLight/20"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 rounded bg-brand-gold text-brand-navy font-semibold hover:bg-brand-goldDim disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Sending…' : 'Send reset link'}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-4 p-3 rounded text-brand-error bg-brand-errorBg/20 text-sm"
        >
          {ERROR_COPY[error]}
        </p>
      )}

      <p className="mt-6 text-sm text-center text-brand-textSubtle">
        Remember it?{' '}
        <Link href="/signin" className="underline text-brand-white">
          Sign in
        </Link>
      </p>
    </form>
  );
}
