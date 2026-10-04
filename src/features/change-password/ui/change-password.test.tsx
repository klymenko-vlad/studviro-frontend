import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  session,
} from '@/shared/test';

import { ChangePassword } from './change-password';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

async function fill(
  user: ReturnType<typeof renderWithProviders>['user'],
  values: { current: string; next: string; confirm: string },
) {
  await user.type(screen.getByLabelText(/^Current password/), values.current);
  await user.type(screen.getByLabelText(/^New password/), values.next);
  await user.type(screen.getByLabelText(/^Confirm new password/), values.confirm);
  await user.click(screen.getByRole('button', { name: 'Change password' }));
}

describe('ChangePassword', () => {
  it('sends the change through the BFF and clears the form', async () => {
    let sent: unknown;
    server.use(
      http.post('/api/auth/password', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ user: session.user });
      }),
    );
    const { user } = renderWithProviders(<ChangePassword />);

    await fill(user, {
      current: 'correct horse battery staple',
      next: 'a brand new passphrase',
      confirm: 'a brand new passphrase',
    });

    await vi.waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Your password was changed. Every other session was signed out.',
      );
    });
    expect(sent).toEqual({
      currentPassword: 'correct horse battery staple',
      newPassword: 'a brand new passphrase',
    });
    expect(screen.getByLabelText(/^Current password/)).toHaveValue('');
  });

  it('marks the current password when it is wrong', async () => {
    server.use(
      http.post('/api/auth/password', () =>
        HttpResponse.json(
          {
            ...errorResponse(400, 'The current password is incorrect'),
            code: 'CURRENT_PASSWORD_INCORRECT',
          },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWithProviders(<ChangePassword />);

    await fill(user, {
      current: 'not it',
      next: 'a brand new passphrase',
      confirm: 'a brand new passphrase',
    });

    expect(
      await screen.findByText('That is not your current password.'),
    ).toBeInTheDocument();
  });

  it('refuses a confirmation that does not match before sending anything', async () => {
    let called = false;
    server.use(
      http.post('/api/auth/password', () => {
        called = true;
        return HttpResponse.json({ user: session.user });
      }),
    );
    const { user } = renderWithProviders(<ChangePassword />);

    await fill(user, {
      current: 'correct horse battery staple',
      next: 'a brand new passphrase',
      confirm: 'a different passphrase',
    });

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('refuses a new password below the policy', async () => {
    const { user } = renderWithProviders(<ChangePassword />);

    await fill(user, { current: 'correct horse', next: 'short', confirm: 'short' });

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(toast.success).not.toHaveBeenCalled();
  });
});
