import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useState, type ReactElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';

import { TooltipProvider } from '@/shared/ui';

/**
 * Read rather than `import`: next-intl emits `messages/en.d.json.ts` to type the
 * catalogue, and Next's build-time type check resolves a JSON import to that
 * declaration instead of the data. Reading the file sidesteps the conflict and
 * still gives tests the real strings, so a missing key fails a test.
 */
// Resolved from the Vitest root rather than `import.meta.url`, which Vite
// rewrites to a non-file URL under the jsdom environment.
const messages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'messages/en.json'), 'utf8'),
) as Record<string, unknown>;

/**
 * A fresh QueryClient per test. Sharing one would let a cached response from an
 * earlier test satisfy a later one, which is how a suite starts passing in
 * isolation and failing in a different order.
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Retries turn an intentionally-failing request into a multi-second wait
      // and then a timeout, instead of an immediate, readable assertion failure.
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function AllProviders({ children }: { children: ReactNode }) {
  // Held in state, not created inline: a re-render would otherwise swap in a new
  // client and drop every in-flight query, which reads as "loading forever".
  const [queryClient] = useState(createTestQueryClient);

  return (
    <NextIntlClientProvider locale="en" messages={messages} timeZone="Europe/Kyiv">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}

/**
 * Renders with the same providers the app mounts, and returns a `user` bound to
 * this render — always drive interactions through it rather than `fireEvent`,
 * which skips the pointer/focus events real users generate.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

export * from '@testing-library/react';
export { userEvent };
