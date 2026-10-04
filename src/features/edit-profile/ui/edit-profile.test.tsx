import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { renderWithProviders, screen, server, users } from '@/shared/test';

import { EditProfile } from './edit-profile';

const refresh = vi.hoisted(() => vi.fn());
vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

describe('EditProfile', () => {
  it('shows the address it cannot change and the name it can', () => {
    renderWithProviders(
      <EditProfile displayName="Ada Lovelace" email="ada@example.com" />,
    );

    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Display name/)).toHaveValue('Ada Lovelace');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('saves a new name and refreshes the page around it', async () => {
    let sent: unknown;
    server.use(
      http.patch('/api/proxy/api/v1/users/me', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ ...users[0], displayName: 'Ada King' });
      }),
    );
    const { user } = renderWithProviders(
      <EditProfile displayName="Ada Lovelace" email="ada@example.com" />,
    );

    const name = screen.getByLabelText(/^Display name/);
    await user.clear(name);
    await user.type(name, '  Ada King ');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await vi.waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    expect(sent).toEqual({ displayName: 'Ada King' });
  });

  it('refuses an empty name', async () => {
    const { user } = renderWithProviders(
      <EditProfile displayName="Ada Lovelace" email="ada@example.com" />,
    );

    await user.clear(screen.getByLabelText(/^Display name/));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
