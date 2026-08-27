import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { MyCoursesView } from './my-courses-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

describe('MyCoursesView', () => {
  it('lists the courses of someone who may read enrolments', async () => {
    renderWithProviders(<MyCoursesView institutionId={INSTITUTION} />);

    expect(
      screen.getByRole('heading', { name: 'My courses', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Algorithms')).toBeInTheDocument();
  });

  it('refuses someone the server does not grant enrolment:read', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({
          ...permissions,
          roles: ['student'],
          permissions: ['role:read'],
        }),
      ),
    );

    renderWithProviders(<MyCoursesView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Not available to you')).toBeInTheDocument();
    expect(screen.queryByText('Algorithms')).not.toBeInTheDocument();
  });
});
