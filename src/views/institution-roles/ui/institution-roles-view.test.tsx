import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { InstitutionRolesView } from './institution-roles-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

function readOnly(): void {
  server.use(
    http.get(PERMISSIONS_URL, () =>
      HttpResponse.json({
        ...permissions,
        roles: ['registrar'],
        permissions: ['role:read'],
      }),
    ),
  );
}

describe('InstitutionRolesView', () => {
  it('titles the page with the institution it administers', async () => {
    renderWithProviders(<InstitutionRolesView institutionId={INSTITUTION} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Roles and access',
    );
    expect(await screen.findByText('Pavol Jozef Šafárik University')).toBeInTheDocument();
  });

  it('offers the grant form to someone who may assign roles', async () => {
    renderWithProviders(<InstitutionRolesView institutionId={INSTITUTION} />);

    expect(await screen.findByRole('button', { name: 'Grant role' })).toBeInTheDocument();
  });

  it('withholds the grant form from a reader and says why', async () => {
    readOnly();

    renderWithProviders(<InstitutionRolesView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Read-only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Grant role' })).not.toBeInTheDocument();
  });

  it('still lists the assignments a reader is allowed to see', async () => {
    readOnly();

    renderWithProviders(<InstitutionRolesView institutionId={INSTITUTION} />);

    expect(await screen.findByRole('cell', { name: 'Student' })).toBeInTheDocument();
  });
});
