import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';

// Importing the schema here is deliberate: a missing or malformed variable fails
// `next build` instead of surfacing as `undefined` at runtime in production.
import './src/env';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/shared/config/i18n/request.ts',
  experimental: {
    // Generates a typed union of message keys, so `t('does.not.exist')` is a
    // type error rather than a silent fallback string.
    createMessagesDeclaration: './messages/en.json',
  },
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env['ANALYZE'] === 'true',
});

/**
 * Baseline security headers. CSP is intentionally not set here — it needs a
 * per-request nonce, which belongs in `src/proxy.ts`.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Lint runs as its own CI job; the build should only ever fail on type errors.
  typescript: { ignoreBuildErrors: false },

  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },

  experimental: {
    /**
     * Import only what a module actually uses instead of the whole barrel file.
     * `@/shared/ui` matters most: it re-exports every shadcn component, and
     * without this a page that renders one `Button` pulls the entire design
     * system — Radix included — into its client chunk.
     */
    optimizePackageImports: ['lucide-react', '@tanstack/react-query', '@/shared/ui'],
  },

  headers: () => Promise.resolve([{ source: '/:path*', headers: securityHeaders }]),
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
