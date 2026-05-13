'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signinAction, type SigninError } from './actions';

const ERROR_COPY: Record<SigninError, React.ReactNode> = {
  all_fields_required: 'Please enter email and password.',
  invalid_credentials: 'Invalid email or password.',
  rate_limit: 'Too many sign-in attempts. Please try again in an hour.',
  signin_failed: (
    <>
      Something went wrong. Please try again, or{' '}
      <Link href="/help" className="underline">
        contact support
      </Link>
      .
    </>
  ),
};

export function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '';
  const resetSuccess = searchParams.get('reset') === 'true';
  const signedOut = searchParams.get('signedout') === 'true';
  const verificationFailed = searchParams.get('error') === 'verification_failed';

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<SigninError | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signinAction(formData);
      if (result.ok) {
        router.replace(result.redirectTo);
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
      <h1 className="text-3xl mb-6">Sign in</h1>

      {resetSuccess && (
        <p
          role="status"
          className="mb-4 p-3 rounded text-brand-success bg-brand-successBg/20 text-sm"
        >
          Password updated. Please sign in.
        </p>
      )}

      {signedOut && (
        <p
          role="status"
          className="mb-4 p-3 rounded text-brand-success bg-brand-successBg/20 text-sm"
        >
          You&rsquo;ve been signed out.
        </p>
      )}

      {verificationFailed && (
        <p
          role="alert"
          className="mb-4 p-3 rounded text-brand-error bg-brand-errorBg/20 text-sm"
        >
          That verification link is invalid or has expired. Please sign in or sign up again.
        </p>
      )}

      <input type="hidden" name="returnTo" value={returnTo} />

      <label className="block mb-4">
        <span className="block text-sm mb-1">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-3 py-2 rounded bg-brand-navyDeep text-brand-white border border-brand-borderLight/20"
        />
      </label>

      <label className="block mb-6">
        <span className="block text-sm mb-1">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 rounded bg-brand-navyDeep text-brand-white border border-brand-borderLight/20"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 rounded bg-brand-gold text-brand-navy font-semibold hover:bg-brand-goldDim disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Signing in…' : 'Sign in'}
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
        <Link href="/forgot" className="underline text-brand-white">
          Forgot password?
        </Link>
      </p>
      <p className="mt-2 text-sm text-center text-brand-textSubtle">
        Don&rsquo;t have an account?{' '}
        <Link href="/signup" className="underline text-brand-white">
          Sign up
        </Link>
      </p>
    </form>
  );
}
