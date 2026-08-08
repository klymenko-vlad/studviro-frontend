import type { MetadataRoute } from 'next';
import { env } from '@/env';

/**
 * Only production invites crawlers. Staging and preview deployments serve the
 * same content on a different host, and an indexed preview both leaks unreleased
 * work and competes with production for the same queries.
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = env.NEXT_PUBLIC_ENV === 'production';

  if (!isProduction) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Authenticated surfaces have nothing a crawler can reach, and listing
        // them keeps them out of the index if that ever changes.
        disallow: ['/api/', '/dashboard'],
      },
    ],
    sitemap: new URL('/sitemap.xml', env.NEXT_PUBLIC_APP_URL).toString(),
    host: env.NEXT_PUBLIC_APP_URL,
  };
}
