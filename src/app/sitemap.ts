import type { MetadataRoute } from 'next';
import { env } from '@/env';

/**
 * Public, indexable routes. Authenticated pages are deliberately absent — a
 * crawler hitting them gets a redirect, which is a wasted crawl budget entry.
 *
 * Add a path here when you add a public page; there is no filesystem scan,
 * because that would happily publish every route group and preview page too.
 *
 * One entry per page rather than one per page-and-locale: the locale lives in a
 * cookie now, so both languages are served from the same URL and there is no
 * per-locale address to list.
 */
const PUBLIC_PATHS = [
  '/',
  '/for-students',
  '/for-teachers',
  '/for-institutions',
  '/contact',
] as const;

/** Relative importance, highest for the entry point. */
const PRIORITIES: Record<(typeof PUBLIC_PATHS)[number], number> = {
  '/': 1,
  '/for-students': 0.8,
  '/for-teachers': 0.8,
  '/for-institutions': 0.8,
  '/contact': 0.6,
};

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map(path => ({
    url: new URL(path, env.NEXT_PUBLIC_APP_URL).toString(),
    changeFrequency: 'weekly' as const,
    priority: PRIORITIES[path],
  }));
}
