import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  waitFor,
} from '@/shared/test';

import { RequestPasswordResetForm } from './request-password-reset-form';

// No `Toaster` is mounted in a test tree, so the call is what there is to assert.
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const REQUEST_URL = '/api/proxy/api/v1/auth/password-reset/request';

describe('RequestPasswordResetForm', () => {
  it('rejects a malformed email before it reaches the network', async () => {
    const { user } = renderWithProviders(<RequestPasswordResetForm />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows the same neutral confirmation for any address', async () => {
    server.use(http.post(REQUEST_URL, () => HttpResponse.json({})));

    const { user } = renderWithProviders(<RequestPasswordResetForm />);

    await user.type(screen.getByLabelText('Email'), 'nobody@studviro.local');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => {
      expect(
        screen.getByText("If that address has an account, we've sent a reset link"),
      ).toBeInTheDocument();
    });
  });

  it('surfaces the dev-only token as a link when the environment has no mail transport', async () => {
    server.use(
      http.post(REQUEST_URL, () => HttpResponse.json({ devToken: 'a'.repeat(64) })),
    );

    const { user } = renderWithProviders(<RequestPasswordResetForm />);

    await user.type(screen.getByLabelText('Email'), 'known@studviro.local');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    const link = await screen.findByRole('link', {
      name: 'Continue with the reset link',
    });
    expect(link).toHaveAttribute('href', `/reset-password?token=${'a'.repeat(64)}`);
  });

  it('surfaces a rate-limit failure rather than the neutral confirmation', async () => {
    server.use(
      http.post(REQUEST_URL, () =>
        HttpResponse.json(errorResponse(429, 'Too many requests'), { status: 429 }),
      ),
    );

    const { user } = renderWithProviders(<RequestPasswordResetForm />);

    await user.type(screen.getByLabelText('Email'), 'someone@studviro.local');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Too many requests');
    });
  });
});
