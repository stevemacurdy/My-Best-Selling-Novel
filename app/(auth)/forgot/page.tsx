import { ForgotForm } from './form';

export const metadata = {
  title: 'Forgot password — My Best Selling Novel',
  description: 'Reset your password.',
};

export default function ForgotPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <ForgotForm />
    </main>
  );
}
