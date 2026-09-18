import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { LinkedAccounts } from './linked-accounts';

const IDENTITIES_URL = '/api/proxy/api/v1/users/me/identities';

describe('LinkedAccounts', () => {
  it('identifies a linked account by its provider username', async () => {
    renderWithProviders(<LinkedAccounts />);

    expect(await screen.findByText('ada123')).toBeInTheDocument();
  });

  it('says when the account was last used', async () => {
    renderWithProviders(<LinkedAccounts />);

    expect(await screen.findByText(/^Last used /)).toBeInTheDocument();
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
