import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  waitFor,
} from '@/shared/test';

import { RoleAssignmentTable } from './role-assignment-table';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const ASSIGNMENTS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/role-assignments`;

describe('RoleAssignmentTable', () => {
  it('renders one row per assignment', async () => {
    renderWithProviders(<RoleAssignmentTable institutionId={INSTITUTION} />);

    expect(await screen.findByRole('cell', { name: 'Student' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Teaching assistant' })).toBeInTheDocument();
  });

  it('shows an em dash rather than an empty cell for an institution-wide role', async () => {
    renderWithProviders(<RoleAssignmentTable institutionId={INSTITUTION} />);

    expect(await screen.findByText('—')).toBeInTheDocument();
  });

  it('revokes the assignment whose row was acted on', async () => {
    const revoked = vi.fn();
    server.use(
      http.delete(`${ASSIGNMENTS_URL}/:id`, ({ params }) => {
        revoked(params['id']);

        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { user } = renderWithProviders(
      <RoleAssignmentTable institutionId={INSTITUTION} />,
    );

    await user.click(await screen.findByRole('button', { name: 'Revoke Student' }));

    await waitFor(() => {
      expect(revoked).toHaveBeenCalledWith('44444444-4444-4444-8444-444444444444');
    });
  });

  it('explains an institution with no assignments', async () => {
    server.use(http.get(ASSIGNMENTS_URL, () => HttpResponse.json([])));

    renderWithProviders(<RoleAssignmentTable institutionId={INSTITUTION} />);

    expect(
      await screen.findByText('No roles have been assigned in this institution yet.'),
    ).toBeInTheDocument();
  });

  it('reports a refusal instead of an empty table', async () => {
    server.use(
      http.get(ASSIGNMENTS_URL, () =>
        HttpResponse.json(errorResponse(403, 'Denied', 'Forbidden'), { status: 403 }),
      ),
    );

    renderWithProviders(<RoleAssignmentTable institutionId={INSTITUTION} />);

    expect(await screen.findByText('Roles could not be loaded')).toBeInTheDocument();
  });
});
