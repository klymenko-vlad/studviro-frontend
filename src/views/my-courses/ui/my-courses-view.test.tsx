import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { MyCoursesView } from './my-courses-view';

const search = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/institutions/x/courses',
  useSearchParams: () => search.value,
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

describe('MyCoursesView', () => {
  beforeEach(() => {
    search.value = new URLSearchParams();
  });

  it('lists the courses of someone who may read enrolments', async () => {
    renderWithProviders(<MyCoursesView institutionId={INSTITUTION} />);

    expect(
      screen.getByRole('heading', { name: 'Courses', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Algorithms')).toBeInTheDocument();
  });

  it('keeps finding a new course one tab away, and opens on it when asked', async () => {
    search.value = new URLSearchParams('tab=find');
    renderWithProviders(<MyCoursesView institutionId={INSTITUTION} />);

    expect(await screen.findByRole('tab', { name: 'Find courses' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'My courses' })).toBeInTheDocument();
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
