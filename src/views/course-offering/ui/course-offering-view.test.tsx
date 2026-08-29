import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { CourseOfferingView } from './course-offering-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

const render = () =>
  renderWithProviders(
    <CourseOfferingView institutionId={INSTITUTION} offeringId={OFFERING} />,
  );

describe('CourseOfferingView', () => {
  it('shows the course to someone the server grants offering:read', async () => {
    render();

    expect(
      await screen.findByRole('heading', { name: 'Algorithms' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to my courses' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses`,
    );
  });

  it('refuses someone without offering:read instead of calling the API', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({
          ...permissions,
          roles: ['student'],
          permissions: ['role:read'],
        }),
      ),
    );

    render();

    expect(
      await screen.findByText('This course is not yours to see'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Algorithms' })).not.toBeInTheDocument();
  });
});
