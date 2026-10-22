import { headers } from 'next/headers';

import { NONCE_HEADER } from '@/shared/config';

/**
 * Structured data for a crawler.
 *
 * The nonce comes from `src/proxy.ts` through a request header, the same way
 * the theme script gets one: `script-src` is nonce-based, so a tag without it
 * is blocked outright — and a blocked JSON-LD tag fails silently, which is the
 * worst way for structured data to be wrong.
 */
export async function JsonLd({ data }: { data: Record<string, unknown> }) {
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
