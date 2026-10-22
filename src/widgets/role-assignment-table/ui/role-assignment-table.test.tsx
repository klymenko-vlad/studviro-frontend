import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@/shared/test';

import { RoleAssignmentTable } from './role-assignment-table';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const ASSIGNMENTS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/role-assignments`;

describe('RoleAssignmentTable', () => {
  it('renders one row per assignment', async () => {
    renderWithProviders(<RoleAssignmentTable institutionId={INSTITUTION} />);

    expect(await screen.findByRole('cell', { name: 'Student' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Registrar' })).toBeInTheDocument();
  });

  it('marks a derived role as not revocable rather than offering to revoke it', async () => {
    renderWithProviders(<RoleAssignmentTable institutionId={INSTITUTION} />);

    const derivedRow = (await screen.findByRole('cell', { name: 'Student' })).closest(
      'tr',
    );
    expect(derivedRow).not.toBeNull();
    expect(
      within(derivedRow as HTMLElement).getByText('Derived, follows academic record'),
    ).toBeInTheDocument();
    expect(
      within(derivedRow as HTMLElement).queryByRole('button', { name: /Revoke/ }),
    ).not.toBeInTheDocument();
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

    await user.click(await screen.findByRole('button', { name: 'Revoke Registrar' }));

    await waitFor(() => {
      expect(revoked).toHaveBeenCalledWith('66666666-6666-4666-8666-666666666666');
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
