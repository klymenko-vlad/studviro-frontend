import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { OrgUnitTree } from './org-unit-tree';

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

    expect(
      await screen.findByText('Faculty of Mathematics and Physics'),
    ).toBeInTheDocument();
    expect(screen.getByText('Department of Informatics')).toBeInTheDocument();
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

      expect(await screen.findByText('School')).toBeInTheDocument();
      expect(screen.queryByText('Faculty')).not.toBeInTheDocument();
    });

    it('keeps the platform’s word where the institution has not chosen one', async () => {
      server.use(http.get(ORG_UNITS_URL, () => HttpResponse.json([university])));

      renderWithProviders(<OrgUnitTree institutionId={INSTITUTION} />);

      expect(await screen.findByText('University')).toBeInTheDocument();
    });
  });
});
