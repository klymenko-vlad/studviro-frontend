import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  accountSessions,
  renderWithProviders,
  screen,
  server,
  within,
} from '@/shared/test';

import { ManageSessions } from './manage-sessions';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PHONE = accountSessions[1]!.id;

describe('ManageSessions', () => {
  it('names each device and marks the one in use', async () => {
    renderWithProviders(<ManageSessions />);

    const current = (await screen.findByText('Firefox on Linux')).closest('li')!;
    expect(within(current).getByText('This device')).toBeInTheDocument();
    expect(within(current).queryByRole('button')).not.toBeInTheDocument();

    const phone = screen.getByText('Safari on iOS').closest('li')!;
    expect(
      within(phone).getByRole('button', { name: 'Sign out Safari on iOS' }),
    ).toBeEnabled();
  });

  it('signs one other device out and reloads the list', async () => {
    let revoked: string | undefined;
    let listed = 0;
    server.use(
      http.delete('/api/proxy/api/v1/users/me/sessions/:sessionId', ({ params }) => {
        revoked = String(params['sessionId']);
        return new HttpResponse(null, { status: 204 });
      }),
      http.get('/api/proxy/api/v1/users/me/sessions', () => {
        listed += 1;
        return HttpResponse.json(
          listed === 1 ? accountSessions : accountSessions.slice(0, 1),
        );
      }),
    );
    const { user } = renderWithProviders(<ManageSessions />);

    await user.click(
      await screen.findByRole('button', { name: 'Sign out Safari on iOS' }),
    );

    await vi.waitFor(() => {
      expect(screen.queryByText('Safari on iOS')).not.toBeInTheDocument();
    });
    expect(revoked).toBe(PHONE);
  });

  it('signs out every other session at once', async () => {
    let called = false;
    server.use(
      http.delete('/api/proxy/api/v1/users/me/sessions', () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderWithProviders(<ManageSessions />);

    await user.click(
      await screen.findByRole('button', { name: 'Sign out all other sessions' }),
    );

    await vi.waitFor(() => {
      expect(called).toBe(true);
    });
  });

  it('offers no mass sign-out when this is the only session', async () => {
    server.use(
      http.get('/api/proxy/api/v1/users/me/sessions', () =>
        HttpResponse.json(accountSessions.slice(0, 1)),
      ),
    );
    renderWithProviders(<ManageSessions />);

    await screen.findByText('Firefox on Linux');
    expect(
      screen.queryByRole('button', { name: 'Sign out all other sessions' }),
    ).not.toBeInTheDocument();
  });

  it('says so when the list cannot be loaded', async () => {
    server.use(
      http.get('/api/proxy/api/v1/users/me/sessions', () =>
        HttpResponse.json({ statusCode: 500, message: 'boom' }, { status: 500 }),
      ),
    );
    renderWithProviders(<ManageSessions />);

    expect(
      await screen.findByText('Your sessions could not be loaded'),
    ).toBeInTheDocument();
  });
});
