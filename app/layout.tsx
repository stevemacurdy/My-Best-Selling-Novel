import type { Metadata } from 'next';
import { Crimson_Pro } from 'next/font/google';
import './globals.css';

const crimson = Crimson_Pro({ subsets: ['latin'], variable: '--font-crimson' });

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
    <html lang="en" className={crimson.variable}>
      <body>{children}</body>
    </html>
  );
}
