import { SignupForm } from '@/components/SignupForm';

export const metadata = {
  title: 'Sign up — My Best Selling Novel',
  description: 'Create your account.',
};

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <SignupForm />
    </main>
  );
}
