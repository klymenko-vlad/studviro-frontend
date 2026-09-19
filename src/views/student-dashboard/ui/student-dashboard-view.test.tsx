import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  permissions,
  renderAndAudit,
  renderWithProviders,
  screen,
  server,
} from '@/shared/test';

import { StudentDashboardView } from './student-dashboard-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

describe('StudentDashboardView', () => {
  it('names the institution as the page heading once it loads', async () => {
    renderWithProviders(<StudentDashboardView institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('heading', {
        name: 'Pavol Jozef Šafárik University',
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('composes the tiles the server grants', async () => {
    renderWithProviders(<StudentDashboardView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Current courses')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
  });

  it('drops the grades tile when the server withholds grade:read', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({
          ...permissions,
          roles: ['student'],
          permissions: ['enrollment:read', 'schedule:read'],
        }),
      ),
    );

    renderWithProviders(<StudentDashboardView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Current courses')).toBeInTheDocument();
    expect(screen.queryByText('Results')).not.toBeInTheDocument();
  });

  it('explains a member the server grants neither read', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({ ...permissions, roles: ['student'], permissions: [] }),
      ),
    );

    renderWithProviders(<StudentDashboardView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Nothing to show yet')).toBeInTheDocument();
  });
});

describe('StudentDashboardView accessibility', () => {
  it('has no axe violations once every tile has loaded', async () => {
    await renderAndAudit(<StudentDashboardView institutionId={INSTITUTION} />, () =>
      screen.findByText('Current courses'),
    );
  });
});
