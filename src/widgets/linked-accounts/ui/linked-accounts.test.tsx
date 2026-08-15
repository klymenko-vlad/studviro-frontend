import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { LinkedAccounts } from './linked-accounts';

const IDENTITIES_URL = '/api/proxy/api/v1/users/me/identities';

describe('LinkedAccounts', () => {
  it('identifies a linked account by its provider username', async () => {
    renderWithProviders(<LinkedAccounts />);

    expect(await screen.findByText('ada123')).toBeInTheDocument();
    expect(screen.getByText('Student information system')).toBeInTheDocument();
  });

  it('says when the account was last used', async () => {
    renderWithProviders(<LinkedAccounts />);

    expect(await screen.findByText(/^Last used /)).toBeInTheDocument();
  });

  it('falls back to the issuer host when the provider gave no username', async () => {
    server.use(
      http.get(IDENTITIES_URL, () =>
        HttpResponse.json([
          {
            id: '99999999-9999-4999-8999-999999999999',
            institutionId: '55555555-5555-4555-8555-555555555555',
            sourceSystem: 'lms',
            issuer: 'https://moodle.upjs.sk',
            externalUsername: null,
            lastAuthenticatedAt: null,
          },
        ]),
      ),
    );

    renderWithProviders(<LinkedAccounts />);

    expect(await screen.findByText('moodle.upjs.sk')).toBeInTheDocument();
    expect(screen.getByText('Not used yet')).toBeInTheDocument();
  });

  it('explains an empty result', async () => {
    server.use(http.get(IDENTITIES_URL, () => HttpResponse.json([])));

    renderWithProviders(<LinkedAccounts />);

    expect(
      await screen.findByText('No university account is linked yet.'),
    ).toBeInTheDocument();
  });

  it('reports a failure instead of an empty state', async () => {
    server.use(
      http.get(IDENTITIES_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderWithProviders(<LinkedAccounts />);

    expect(
      await screen.findByText('Linked accounts could not be loaded'),
    ).toBeInTheDocument();
  });
});
