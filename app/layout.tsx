import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'My Best Selling Novel',
  description: 'AI-guided book writing platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
