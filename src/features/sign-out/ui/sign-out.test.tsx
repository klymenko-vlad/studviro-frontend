import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { renderWithProviders, screen, server } from '@/shared/test';
import { DropdownMenu, DropdownMenuContent } from '@/shared/ui';

import { SignOutMenuItem } from './sign-out';

function renderOpenMenu() {
  return renderWithProviders(
    <DropdownMenu open>
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
