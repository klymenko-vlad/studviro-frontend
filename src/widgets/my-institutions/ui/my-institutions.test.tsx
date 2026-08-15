import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { MyInstitutions } from './my-institutions';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

describe('MyInstitutions', () => {
  it('names each institution the person belongs to', async () => {
    renderWithProviders(<MyInstitutions />);

    expect(await screen.findByText('Pavol Jozef Šafárik University')).toBeInTheDocument();
  });

  it('offers role administration to someone who may assign roles', async () => {
    renderWithProviders(<MyInstitutions />);

    expect(await screen.findByRole('link', { name: 'Manage roles' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/roles`,
    );
  });

  it('hides role administration from someone who may not', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({
          ...permissions,
          roles: ['student'],
          permissions: ['role:read'],
        }),
      ),
    );

    renderWithProviders(<MyInstitutions />);

    expect(await screen.findByText('Pavol Jozef Šafárik University')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage roles' })).not.toBeInTheDocument();
  });

  it('explains belonging to no institution at all', async () => {
    server.use(http.get('/api/proxy/api/v1/institutions', () => HttpResponse.json([])));

    renderWithProviders(<MyInstitutions />);

    expect(
      await screen.findByText('You do not belong to any institution yet.'),
    ).toBeInTheDocument();
  });
});
