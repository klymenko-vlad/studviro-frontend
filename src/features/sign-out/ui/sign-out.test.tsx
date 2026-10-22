import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { renderWithProviders, screen, server } from '@/shared/test';
import { DropdownMenu, DropdownMenuContent } from '@/shared/ui';

import { SignOutMenuItem } from './sign-out';

let client: QueryClient | undefined;

function CaptureClient() {
  const queryClient = useQueryClient();
  useEffect(() => {
    client = queryClient;
  }, [queryClient]);
  return null;
}

function renderOpenMenu() {
  return renderWithProviders(
    <DropdownMenu open>
      <CaptureClient />
      <DropdownMenuContent>
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>,
  );
}

const push = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ push, refresh }),
}));

describe('SignOutMenuItem', () => {
  it('sends the user home once the session is cleared', async () => {
    const { user } = renderOpenMenu();

    await user.click(await screen.findByRole('menuitem', { name: /sign out/i }));

    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/');
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('forgets everything cached for the person signing out', async () => {
    const { user } = renderOpenMenu();
    client!.setQueryData(['permissions'], { permissions: ['audit:read'] });

    await user.click(await screen.findByRole('menuitem', { name: /sign out/i }));

    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/');
    });
    expect(client!.getQueryData(['permissions'])).toBeUndefined();
  });

  it('still signs the browser out when the API call fails', async () => {
    server.use(http.post('/api/auth/logout', () => HttpResponse.error()));

    const { user } = renderOpenMenu();
    await user.click(await screen.findByRole('menuitem', { name: /sign out/i }));

    // The Route Handler clears the cookies regardless, so staying put would
    // leave the user looking signed in while they are not.
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/');
    });
  });
});
