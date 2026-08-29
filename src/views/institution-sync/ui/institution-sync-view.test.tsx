import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { InstitutionSyncView } from './institution-sync-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

describe('InstitutionSyncView', () => {
  it('shows the synchronization state to someone who may read it', async () => {
    renderWithProviders(<InstitutionSyncView institutionId={INSTITUTION} />);

    expect(
      screen.getByRole('heading', { name: 'Synchronization', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Run history')).toBeInTheDocument();
  });

  it('offers a run to someone the server grants sync:run', async () => {
    renderWithProviders(<InstitutionSyncView institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('button', { name: 'Run synchronization' }),
    ).toBeInTheDocument();
  });

  it('withholds the run action from a reader who may not start one', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({
          ...permissions,
          roles: ['registrar'],
          permissions: ['sync:read'],
        }),
      ),
    );

    renderWithProviders(<InstitutionSyncView institutionId={INSTITUTION} />);

    expect(
      await screen.findByText('You may read synchronization here, but not start a run.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Run synchronization' }),
    ).not.toBeInTheDocument();
  });

  it('refuses someone the server does not grant sync:read', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({
          ...permissions,
          roles: ['student'],
          permissions: ['grade:read'],
        }),
      ),
    );

    renderWithProviders(<InstitutionSyncView institutionId={INSTITUTION} />);

    expect(
      await screen.findByText('Synchronization is not yours to see'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Run history')).not.toBeInTheDocument();
  });
});
