'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signupAction, type SignupError } from '@/app/(auth)/signup/actions';

const ERROR_COPY: Record<SignupError, React.ReactNode> = {
  all_fields_required: 'Please fill in all fields.',
  password_too_short: 'Password must be at least 12 characters.',
  must_accept_all: 'Please accept the Terms, Privacy Policy, and Refund Policy.',
  password_breached: 'This password appears in known data breaches. Please choose a different one.',
  email_in_use: (
    <>
      An account with this email already exists.{' '}
      <Link href="/signin" className="underline">
        Sign in
      </Link>{' '}
      instead?
    </>
  ),
  acceptance_failed: (
    <>
      We couldn&rsquo;t record your consent. Please try again, or{' '}
      <Link href="/help" className="underline">
        contact support
      </Link>
      .
    </>
  ),
  signup_failed: (
    <>
      Something went wrong. Please try again, or{' '}
      <Link href="/help" className="underline">
        contact support
      </Link>
      .
    </>
  ),
};

export function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<SignupError | null>(null);
  const [acceptedTos, setAcceptedTos] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedRefunds, setAcceptedRefunds] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<string | null>(null);

  const allAccepted = acceptedTos && acceptedPrivacy && acceptedRefunds;

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signupAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.verifyEmail) {
        setPendingVerification(result.email);
      } else {
        router.replace(result.redirectTo);
      }
    });
  }

  function resetToForm() {
    setPendingVerification(null);
    setError(null);
    setAcceptedTos(false);
    setAcceptedPrivacy(false);
    setAcceptedRefunds(false);
  }

  if (pendingVerification) {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-lg bg-brand-navyLight">
        <h1 className="text-3xl mb-4">Check your inbox</h1>
        <p className="mb-6">
          We sent a verification link to <strong>{pendingVerification}</strong>. Click it to finish
          creating your account.
        </p>
        <p className="text-sm text-brand-textSubtle">
          Wrong email?{' '}
          <button
            type="button"
            onClick={resetToForm}
            className="underline text-brand-white"
          >
            Sign up again
          </button>
        </p>
      </div>
    );
  }

  return (
    <form
      action={onSubmit}
      className="w-full max-w-md mx-auto p-8 rounded-lg bg-brand-navyLight"
    >
      <h1 className="text-3xl mb-6">Create your account</h1>

      <label className="block mb-4">
        <span className="block text-sm mb-1">Full name</span>
        <input
          name="full_name"
          type="text"
          required
          minLength={1}
          maxLength={100}
          autoComplete="name"
          className="w-full px-3 py-2 rounded bg-brand-navyDeep text-brand-white border border-brand-borderLight/20"
        />
      </label>

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
          minLength={12}
          autoComplete="new-password"
          className="w-full px-3 py-2 rounded bg-brand-navyDeep text-brand-white border border-brand-borderLight/20"
        />
        <span className="block text-xs mt-1 text-brand-textSubtle">
          Minimum 12 characters. Checked against known breaches.
        </span>
      </label>

      <fieldset className="mb-6 space-y-2">
        <legend className="sr-only">Acceptance</legend>

        <label className="flex items-start gap-2 text-sm">
          <input
            name="accept_tos"
            type="checkbox"
            required
            checked={acceptedTos}
            onChange={(e) => setAcceptedTos(e.target.checked)}
            className="mt-1"
          />
          <span>
            I agree to the{' '}
            <Link href="/terms" className="underline" target="_blank" rel="noreferrer">
              Terms of Service & Acceptable Use Policy
            </Link>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input
            name="accept_privacy"
            type="checkbox"
            required
            checked={acceptedPrivacy}
            onChange={(e) => setAcceptedPrivacy(e.target.checked)}
            className="mt-1"
          />
          <span>
            I agree to the{' '}
            <Link href="/privacy" className="underline" target="_blank" rel="noreferrer">
              Privacy Policy
            </Link>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input
            name="accept_refunds"
            type="checkbox"
            required
            checked={acceptedRefunds}
            onChange={(e) => setAcceptedRefunds(e.target.checked)}
            className="mt-1"
          />
          <span>
            I agree to the{' '}
            <Link href="/refunds" className="underline" target="_blank" rel="noreferrer">
              Refund Policy
            </Link>
          </span>
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={!allAccepted || pending}
        className="w-full py-3 rounded bg-brand-gold text-brand-navy font-semibold hover:bg-brand-goldDim disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Creating account…' : 'Create account'}
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
        Already have an account?{' '}
        <Link href="/signin" className="underline text-brand-white">
          Sign in
        </Link>
      </p>
    </form>
  );
}
