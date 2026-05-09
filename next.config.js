const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: 'woulfai',
  project: 'mybestsellingnovel-prod',
  silent: !process.env.CI,
});
