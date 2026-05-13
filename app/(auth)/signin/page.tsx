import { Suspense } from 'react';
import { SigninForm } from './form';

export const metadata = {
  title: 'Sign in — My Best Selling Novel',
  description: 'Sign in to your account.',
};

export default function SigninPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <Suspense>
        <SigninForm />
      </Suspense>
    </main>
  );
}
