import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  waitFor,
} from '@/shared/test';

import { GrantRoleForm } from './grant-role-form';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const ASSIGNMENTS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/role-assignments`;
const SUBJECT = '11111111-1111-4111-8111-111111111111';

describe('GrantRoleForm', () => {
  it('submits an institution-wide grant without a scope', async () => {
    const granted = vi.fn();
    server.use(
      http.post(ASSIGNMENTS_URL, async ({ request }) => {
        granted(await request.json());

        return new HttpResponse(null, { status: 201 });
      }),
    );

    const { user } = renderWithProviders(<GrantRoleForm institutionId={INSTITUTION} />);

    await user.type(screen.getByLabelText('Person'), SUBJECT);
    await user.click(screen.getByRole('button', { name: 'Grant role' }));

    await waitFor(() => {
      expect(granted).toHaveBeenCalledWith({
        userId: SUBJECT,
        role: 'course_coordinator',
        scopeType: 'institution',
      });
    });
  });

  it('asks for a scope only once a narrower scope is chosen', async () => {
    const { user } = renderWithProviders(<GrantRoleForm institutionId={INSTITUTION} />);

    expect(screen.queryByLabelText('Scope identifier')).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Scope' }),
      'Study programme',
    );

    expect(await screen.findByLabelText('Scope identifier')).toBeInTheDocument();
  });

  it('refuses to submit a scoped grant with no scope named', async () => {
    const granted = vi.fn();
    server.use(
      http.post(ASSIGNMENTS_URL, () => {
        granted();

        return new HttpResponse(null, { status: 201 });
      }),
    );

    const { user } = renderWithProviders(<GrantRoleForm institutionId={INSTITUTION} />);

    await user.type(screen.getByLabelText('Person'), SUBJECT);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Scope' }),
      'Study programme',
    );
    await user.click(screen.getByRole('button', { name: 'Grant role' }));

    expect(
      await screen.findByText('Name the scope this role applies to'),
    ).toBeInTheDocument();
    expect(granted).not.toHaveBeenCalled();
  });

  it('rejects an identifier that is not a valid uuid', async () => {
    const { user } = renderWithProviders(<GrantRoleForm institutionId={INSTITUTION} />);

    await user.type(screen.getByLabelText('Person'), 'not-a-uuid');
    await user.click(screen.getByRole('button', { name: 'Grant role' }));

    expect(await screen.findByText(/UUID|uuid/)).toBeInTheDocument();
  });

  it('surfaces a duplicate grant on the role field rather than in a toast', async () => {
    server.use(
      http.post(ASSIGNMENTS_URL, () =>
        HttpResponse.json(
          errorResponse(
            409,
            'This person already holds that role in that scope',
            'Conflict',
          ),
          { status: 409 },
        ),
      ),
    );

    const { user } = renderWithProviders(<GrantRoleForm institutionId={INSTITUTION} />);

    await user.type(screen.getByLabelText('Person'), SUBJECT);
    await user.click(screen.getByRole('button', { name: 'Grant role' }));

    expect(
      await screen.findByText('This person already holds that role in that scope'),
    ).toBeInTheDocument();
  });
});
