import Link from 'next/link';

export const metadata = {
  title: 'Account — My Best Selling Novel',
  description: 'Your account.',
};

// Stub. Real /account UI lands in TASK-047 (account dashboard).
export default function AccountPage() {
  return (
    <main className="min-h-screen px-8 py-12">
      <h1 className="text-3xl mb-4">Account</h1>
      <p className="mb-6">
        Phase 6/7 will land the real account dashboard here. For now, this page exists so the
        AuthGuard above (in app/account/layout.tsx) can be smoke-tested.
      </p>
      <p>
        <Link href="/auth/signout" className="underline text-brand-gold">
          Sign out
        </Link>
      </p>
    </main>
  );
}
