import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  permissions,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  within,
} from '@/shared/test';

import { OrgUnitTree } from './org-unit-tree';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/**
 * The card also carries a create form whose parent select lists every unit by
 * name, so a bare `getByText` would match the option as well as the node.
 */
const tree = async () => within(await screen.findByRole('list', { name: 'Org units' }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const ORG_UNITS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/org-units`;

const faculty = {
  id: '11111111-1111-4111-8111-111111111111',
  institutionId: INSTITUTION,
  parentId: null,
  type: 'faculty',
  code: 'fmfi',
  name: 'Faculty of Mathematics and Physics',
};

const department = {
  id: '22222222-2222-4222-8222-222222222222',
  institutionId: INSTITUTION,
  parentId: faculty.id,
  type: 'department',
  code: 'ki',
  name: 'Department of Informatics',
};

describe('OrgUnitTree', () => {
  it('nests a department beneath its faculty', async () => {
    server.use(http.get(ORG_UNITS_URL, () => HttpResponse.json([faculty, department])));

    renderWithProviders(<OrgUnitTree institutionId={INSTITUTION} />);

    const listed = await tree();

    expect(listed.getByText('Faculty of Mathematics and Physics')).toBeInTheDocument();
    expect(listed.getByText('Department of Informatics')).toBeInTheDocument();
  });

  it('explains an institution with no org units', async () => {
    server.use(http.get(ORG_UNITS_URL, () => HttpResponse.json([])));

    renderWithProviders(<OrgUnitTree institutionId={INSTITUTION} />);

    expect(
      await screen.findByText('This institution has no org units yet.'),
    ).toBeInTheDocument();
  });

  it('reports a refusal instead of an empty tree', async () => {
    server.use(
      http.get(ORG_UNITS_URL, () =>
        HttpResponse.json(errorResponse(403, 'Denied', 'Forbidden'), { status: 403 }),
      ),
    );

    renderWithProviders(<OrgUnitTree institutionId={INSTITUTION} />);

    expect(await screen.findByText('Org units could not be loaded')).toBeInTheDocument();
  });

  describe('the institution’s own words (B7)', () => {
    const university = {
      id: '33333333-3333-4333-8333-333333333333',
      institutionId: INSTITUTION,
      parentId: null,
      type: 'university',
      code: 'upjs',
      name: 'UPJŠ',
    };

    it('calls a faculty what this institution calls it', async () => {
      server.use(http.get(ORG_UNITS_URL, () => HttpResponse.json([faculty])));

      renderWithProviders(<OrgUnitTree institutionId={INSTITUTION} />);

      const listed = await tree();

      expect(listed.getByText('School')).toBeInTheDocument();
      expect(listed.queryByText('Faculty')).not.toBeInTheDocument();
    });

    it('keeps the platform’s word where the institution has not chosen one', async () => {
      server.use(http.get(ORG_UNITS_URL, () => HttpResponse.json([university])));

      renderWithProviders(<OrgUnitTree institutionId={INSTITUTION} />);

      const listed = await tree();

      expect(listed.getByText('University')).toBeInTheDocument();
    });
  });

  describe('building the tree (N2)', () => {
    beforeEach(() => {
      vi.mocked(toast.success).mockClear();
      vi.mocked(toast.error).mockClear();
    });

    const withoutManage = () => {
      server.use(
        http.get(`/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`, () =>
          HttpResponse.json({
            ...permissions,
            roles: ['registrar'],
            permissions: ['institution:read', 'role:read'],
          }),
        ),
      );
    };

    it('adds a unit, offering every existing unit as a possible parent', async () => {
      server.use(http.get(ORG_UNITS_URL, () => HttpResponse.json([faculty, department])));

      renderWithProviders(<OrgUnitTree institutionId={INSTITUTION} />);

      const parent = await screen.findByLabelText('Sits under');
      expect(
        within(parent).getByRole('option', { name: 'Nothing — this is a root unit' }),
      ).toBeInTheDocument();
      expect(
        within(parent).getByRole('option', {
          name: 'Faculty of Mathematics and Physics',
        }),
      ).toBeInTheDocument();

      await userEvent.type(screen.getByLabelText('Code'), 'KPI');
      await userEvent.type(screen.getByLabelText('Name'), 'Department of Computers');
      await userEvent.click(screen.getByRole('button', { name: 'Add unit' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('New faculty was added.');
      });
    });

    it('explains why a unit with children cannot be retired', async () => {
      server.use(
        http.get(ORG_UNITS_URL, () => HttpResponse.json([faculty, department])),
        http.delete(`${ORG_UNITS_URL}/:id`, () =>
          HttpResponse.json(
            errorResponse(
              409,
              'This unit still has units under it; retire or move those first',
              'Conflict',
            ),
            { status: 409 },
          ),
        ),
      );

      renderWithProviders(<OrgUnitTree institutionId={INSTITUTION} />);

      await userEvent.click(
        await screen.findByRole('button', {
          name: 'Retire Faculty of Mathematics and Physics',
        }),
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'This unit still has units under it; retire or move those first',
        );
      });
    });

    it('shows the tree but no way to change it without institution:manage', async () => {
      withoutManage();
      server.use(http.get(ORG_UNITS_URL, () => HttpResponse.json([faculty])));

      renderWithProviders(<OrgUnitTree institutionId={INSTITUTION} />);

      const listed = await tree();
      expect(listed.getByText('Faculty of Mathematics and Physics')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add unit' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Retire/ })).not.toBeInTheDocument();
    });
  });
});
