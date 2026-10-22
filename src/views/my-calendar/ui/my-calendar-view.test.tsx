import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { MyCalendarView } from './my-calendar-view';

// The calendar keeps its view in `?view=`, which needs the app router.
vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/institutions/x/calendar',
  useSearchParams: () => new URLSearchParams('view=list'),
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

describe('MyCalendarView', () => {
  it('heads the screen and shows the week the server returned', async () => {
    renderWithProviders(<MyCalendarView institutionId={INSTITUTION} />);

    expect(
      screen.getByRole('heading', { name: 'Calendar', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByTestId('calendar-week')).toBeInTheDocument();
  });

  it('offers the calendar to other calendar apps', async () => {
    renderWithProviders(<MyCalendarView institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('heading', { name: 'Use in another calendar' }),
    ).toBeInTheDocument();
  });

  it('refuses a caller the server does not grant schedule:read', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({ ...permissions, permissions: ['grade:read'] }),
      ),
    );

    renderWithProviders(<MyCalendarView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Not available to you')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-week')).not.toBeInTheDocument();
    expect(screen.queryByText('Use in another calendar')).not.toBeInTheDocument();
  });
});
