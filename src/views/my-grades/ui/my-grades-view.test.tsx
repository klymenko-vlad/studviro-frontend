import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { MyGradesView } from './my-grades-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

describe('MyGradesView', () => {
  it('lists the results of someone who may read grades', async () => {
    renderWithProviders(<MyGradesView institutionId={INSTITUTION} />);

    expect(
      screen.getByRole('heading', { name: 'My grades', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Algorithms')).toBeInTheDocument();
  });

  it('refuses someone the server does not grant grade:read', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({
          ...permissions,
          roles: ['student'],
          permissions: ['role:read'],
        }),
      ),
    );

    renderWithProviders(<MyGradesView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Grades are not yours to see')).toBeInTheDocument();
    expect(screen.queryByText('Algorithms')).not.toBeInTheDocument();
  });
});
