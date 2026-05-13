const PUBLIC_PATH_PREFIXES = [
  '/',
  '/pricing',
  '/tour',
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/aup',
  '/refunds',
  '/cookies',
  '/dmca',
  '/ai-disclosure',
  '/vuln-disclosure',
  '/a11y-statement',
  '/api/health',
  '/api/stripe/webhook',
  '/auth',
];

export function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATH_PREFIXES.some(
    (p) => p !== '/' && (pathname === p || pathname.startsWith(p + '/')),
  );
}
