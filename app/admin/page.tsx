import Link from 'next/link';

export const metadata = {
  title: 'Admin — My Best Selling Novel',
  description: 'Operator admin dashboard.',
};

// Stub. Real /admin UI lands in Phase 7 (TASK-049–053).
export default function AdminPage() {
  return (
    <main className="min-h-screen px-8 py-12">
      <h1 className="text-3xl mb-4">Admin</h1>
      <p className="mb-6">
        Phase 7 will land the real admin dashboard here. For now, this page exists so the
        AdminGuard above (in app/admin/layout.tsx) can be smoke-tested. Reaching this page
        means you are signed in AND your profiles.role is admin or super_admin.
      </p>
      <p>
        <Link href="/account" className="underline text-brand-gold">
          Account
        </Link>
      </p>
    </main>
  );
}
