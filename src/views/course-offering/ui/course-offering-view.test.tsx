import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { permissions, renderWithProviders, screen, server, within } from '@/shared/test';

import { CourseOfferingView } from './course-offering-view';

// `OfferingTabs` keeps the open section in the query string, which needs the
// app router that no test tree mounts.
const search = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/institutions/x/courses/y',
  useSearchParams: () => search.value,
}));

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
  });

  it('says where the page sits, one tap from the level above', async () => {
    render();

    const trail = await screen.findByRole('navigation', { name: 'You are here' });
    await screen.findByRole('heading', { name: 'Algorithms' });

    expect(within(trail).getAllByRole('link').length).toBeGreaterThan(0);
    expect(within(trail).getByText('Algorithms')).toHaveAttribute('aria-current', 'page');
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
