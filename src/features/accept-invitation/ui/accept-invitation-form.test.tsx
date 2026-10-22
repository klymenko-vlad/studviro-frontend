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

import { AcceptInvitationForm } from './accept-invitation-form';

const TOKEN = 'a'.repeat(64);
const ACCEPT_URL = `/api/proxy/api/v1/invitations/${TOKEN}/accept`;

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => router,
}));

describe('AcceptInvitationForm', () => {
  it('labels the fields a claimant fills in', () => {
    renderWithProviders(<AcceptInvitationForm token={TOKEN} />);

    expect(screen.getByLabelText('Display name')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('blocks submission when the passwords do not match', async () => {
    const submitted = vi.fn();
    server.use(
      http.post(ACCEPT_URL, () => {
        submitted();

        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<AcceptInvitationForm token={TOKEN} />);

    await user.type(screen.getByLabelText('Password'), 'correct horse battery');
    await user.type(screen.getByLabelText('Confirm password'), 'different password');
    await user.click(screen.getByRole('button', { name: 'Accept invitation' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(submitted).not.toHaveBeenCalled();
  });

  it('accepts the invitation and sends the claimant to sign in', async () => {
    router.push.mockClear();
    let received: unknown;
    server.use(
      http.post(ACCEPT_URL, async ({ request }) => {
        received = await request.json();

        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(<AcceptInvitationForm token={TOKEN} />);

    await user.type(screen.getByLabelText('Display name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Password'), 'correct horse battery');
    await user.type(screen.getByLabelText('Confirm password'), 'correct horse battery');
    await user.click(screen.getByRole('button', { name: 'Accept invitation' }));

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/sign-in?accepted=1');
    });
    expect(received).toMatchObject({
      displayName: 'Ada Lovelace',
      password: 'correct horse battery',
    });
  });

  it('answers the same way for an expired, consumed or unknown token', async () => {
    server.use(
      http.post(ACCEPT_URL, () =>
        HttpResponse.json(errorResponse(400, 'This invitation link is no longer valid'), {
          status: 400,
        }),
      ),
    );

    const { user } = renderWithProviders(<AcceptInvitationForm token={TOKEN} />);

    await user.type(screen.getByLabelText('Password'), 'correct horse battery');
    await user.type(screen.getByLabelText('Confirm password'), 'correct horse battery');
    await user.click(screen.getByRole('button', { name: 'Accept invitation' }));

    expect(
      await screen.findByText('This invitation link is no longer valid'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'It may have expired, already been used, or never existed. Ask whoever invited you to send a new one.',
      ),
    ).toBeInTheDocument();
  });
});
