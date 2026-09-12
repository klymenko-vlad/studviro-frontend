import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen, server, waitFor } from '@/shared/test';

import { InvitePersonForm } from './invite-person-form';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const INVITATIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/invitations`;

describe('InvitePersonForm', () => {
  it('submits an institution-wide invitation without a scope', async () => {
    const invited = vi.fn();
    server.use(
      http.post(INVITATIONS_URL, async ({ request }) => {
        invited(await request.json());

        return HttpResponse.json({
          id: '66666666-6666-4666-8666-666666666666',
          institutionId: INSTITUTION,
          address: 'ada@upjs.sk',
          role: 'registrar',
          scopeType: 'institution',
          scopeId: null,
          expiresAt: new Date().toISOString(),
          devToken: 'a'.repeat(64),
        });
      }),
    );

    const { user } = renderWithProviders(
      <InvitePersonForm institutionId={INSTITUTION} />,
    );

    await user.type(screen.getByLabelText('Email address'), 'ada@upjs.sk');
    await user.click(screen.getByRole('button', { name: 'Send invitation' }));

    await waitFor(() => {
      expect(invited).toHaveBeenCalledWith(
        expect.objectContaining({ address: 'ada@upjs.sk', scopeType: 'institution' }),
      );
    });
  });

  it('shows the invitation link once sent, since there is no mail transport outside production', async () => {
    server.use(
      http.post(INVITATIONS_URL, () =>
        HttpResponse.json({
          id: '66666666-6666-4666-8666-666666666666',
          institutionId: INSTITUTION,
          address: 'ada@upjs.sk',
          role: 'registrar',
          scopeType: 'institution',
          scopeId: null,
          expiresAt: new Date().toISOString(),
          devToken: 'b'.repeat(64),
        }),
      ),
    );

    const { user } = renderWithProviders(
      <InvitePersonForm institutionId={INSTITUTION} />,
    );

    await user.type(screen.getByLabelText('Email address'), 'ada@upjs.sk');
    await user.click(screen.getByRole('button', { name: 'Send invitation' }));

    expect(await screen.findByTestId('invite-dev-token')).toHaveTextContent(
      'b'.repeat(64),
    );
  });

  it('rejects an invalid email address', async () => {
    const { user } = renderWithProviders(
      <InvitePersonForm institutionId={INSTITUTION} />,
    );

    await user.type(screen.getByLabelText('Email address'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send invitation' }));

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
  });
});
