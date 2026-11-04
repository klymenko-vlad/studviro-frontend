import type { ReactNode } from 'react';

import { SessionProvider } from '@/entities/session';
import { getCurrentUser } from '@/shared/auth';
import { Toaster, TooltipProvider } from '@/shared/ui';

import { QueryProvider } from './query-provider';
import { WebVitals } from './web-vitals';

/**
 * The single place client-side context is assembled.
 *
 * Deliberately a Server Component: only `QueryProvider` needs to be a client
 * boundary, so keeping this on the server means `children` (page content) stays
 * server-rendered instead of being pulled into the client bundle.
 *
 * `Toaster` is the shadcn wrapper from `@/shared/ui`, not `sonner` directly —
 * it carries the design tokens and the theme wiring.
 *
 * `NextIntlClientProvider` is mounted one level up in the root layout, where the
 * resolved locale lives.
 *
 * The session is resolved here on the server and passed down as a value rather
 * than fetched by the client: the server had to know who the user was in order
 * to render at all, so making the browser ask again would be a round trip to
 * learn something we already had.
 */
export async function AppProviders({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <QueryProvider>
      <SessionProvider value={user ?? null}>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
        <WebVitals />
      </SessionProvider>
    </QueryProvider>
  );
}
