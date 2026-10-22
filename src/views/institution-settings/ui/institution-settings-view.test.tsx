import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { InstitutionSettingsView } from './institution-settings-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

function readOnly(): void {
  server.use(
    http.get(PERMISSIONS_URL, () =>
      HttpResponse.json({
        ...permissions,
        roles: ['student'],
        permissions: ['institution:read'],
      }),
    ),
  );
}

describe('InstitutionSettingsView', () => {
  it('titles the page and names the institution it configures', async () => {
    renderWithProviders(<InstitutionSettingsView institutionId={INSTITUTION} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Institution settings',
    );
    expect(await screen.findByText('Pavol Jozef Šafárik University')).toBeInTheDocument();
  });

  it('offers the settings form to someone who may manage the institution', async () => {
    renderWithProviders(<InstitutionSettingsView institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('button', { name: 'Save settings' }),
    ).toBeInTheDocument();
  });

  it('withholds everything from someone who may only read, and says why', async () => {
    readOnly();

    renderWithProviders(<InstitutionSettingsView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Read-only')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Save settings' }),
    ).not.toBeInTheDocument();
  });
});
