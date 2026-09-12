import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  waitFor,
} from '@/shared/test';

import { ConfirmPasswordResetForm } from './confirm-password-reset-form';

const TOKEN = 'a'.repeat(64);
const CONFIRM_URL = `/api/proxy/api/v1/auth/password-reset/${TOKEN}/confirm`;

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => router,
}));

describe('ConfirmPasswordResetForm', () => {
  it('labels the fields a caller fills in', () => {
    renderWithProviders(<ConfirmPasswordResetForm token={TOKEN} />);

    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('blocks submission when the passwords do not match', async () => {
    const submitted = vi.fn();
    server.use(
      http.post(CONFIRM_URL, () => {
        submitted();

        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<ConfirmPasswordResetForm token={TOKEN} />);

    await user.type(screen.getByLabelText('New password'), 'correct horse battery');
    await user.type(screen.getByLabelText('Confirm password'), 'different password');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(submitted).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than the backend floor', async () => {
    const { user } = renderWithProviders(<ConfirmPasswordResetForm token={TOKEN} />);

    await user.type(screen.getByLabelText('New password'), 'short');
    await user.type(screen.getByLabelText('Confirm password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('sets the new password and sends the caller to sign in', async () => {
    router.push.mockClear();
    let received: unknown;
    server.use(
      http.post(CONFIRM_URL, async ({ request }) => {
        received = await request.json();

        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<ConfirmPasswordResetForm token={TOKEN} />);

    await user.type(screen.getByLabelText('New password'), 'correct horse battery');
    await user.type(screen.getByLabelText('Confirm password'), 'correct horse battery');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/sign-in?reset=1');
    });
    expect(received).toMatchObject({ password: 'correct horse battery' });
  });

  it('answers the same way for an expired, consumed or malformed token', async () => {
    server.use(
      http.post(CONFIRM_URL, () =>
        HttpResponse.json(
          errorResponse(400, 'This password reset link is no longer valid'),
          {
            status: 400,
          },
        ),
      ),
    );

    const { user } = renderWithProviders(<ConfirmPasswordResetForm token={TOKEN} />);

    await user.type(screen.getByLabelText('New password'), 'correct horse battery');
    await user.type(screen.getByLabelText('Confirm password'), 'correct horse battery');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    expect(
      await screen.findByText('This password reset link is no longer valid'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'It may have expired, already been used, or was typed incorrectly. Request a new one.',
      ),
    ).toBeInTheDocument();
  });
});
