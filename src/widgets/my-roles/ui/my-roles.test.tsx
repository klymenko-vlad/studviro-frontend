import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { MyRoles } from './my-roles';

const ROLES_URL = '/api/proxy/api/v1/users/me/roles';

describe('MyRoles', () => {
  it('lists every role the API reports', async () => {
    renderWithProviders(<MyRoles />);

    expect(await screen.findByText('Student')).toBeInTheDocument();
    expect(screen.getByText('Registrar')).toBeInTheDocument();
  });

  it('names the scope a role applies to rather than its raw type', async () => {
    renderWithProviders(<MyRoles />);

    expect(await screen.findByText('Whole institution')).toBeInTheDocument();
    expect(screen.getByText('Course offering')).toBeInTheDocument();
  });

  it('shows when a role expires', async () => {
    renderWithProviders(<MyRoles />);

    expect(await screen.findByText(/^Until /)).toBeInTheDocument();
  });

  it('explains an empty result instead of rendering a bare list', async () => {
    server.use(http.get(ROLES_URL, () => HttpResponse.json([])));

    renderWithProviders(<MyRoles />);

    expect(
      await screen.findByText('No roles have been assigned to you yet.'),
    ).toBeInTheDocument();
  });

  it('reports a failure instead of an empty state', async () => {
    server.use(
      http.get(ROLES_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderWithProviders(<MyRoles />);

    expect(await screen.findByText('Roles could not be loaded')).toBeInTheDocument();
    expect(
      screen.queryByText('No roles have been assigned to you yet.'),
    ).not.toBeInTheDocument();
  });
});
