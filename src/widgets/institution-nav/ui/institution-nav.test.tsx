import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { InstitutionNav } from './institution-nav';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

const pathname = vi.hoisted(() => ({
  value: '/institutions/55555555-5555-4555-8555-555555555555',
}));

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  usePathname: () => pathname.value,
}));

function grant(granted: string[]) {
  server.use(
    http.get(PERMISSIONS_URL, () =>
      HttpResponse.json({ ...permissions, permissions: granted }),
    ),
  );
}

describe('InstitutionNav', () => {
  it('names the section so the landmark is distinguishable', async () => {
    renderWithProviders(<InstitutionNav institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('navigation', { name: 'Institution sections' }),
    ).toBeInTheDocument();
  });

  it('links every screen the caller is allowed to open', async () => {
    renderWithProviders(<InstitutionNav institutionId={INSTITUTION} />);

    expect(await screen.findByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}`,
    );
    expect(screen.getByRole('link', { name: 'Grades' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/grades`,
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/settings`,
    );
  });

  it('links the calendar and the exams once the schedule permission is granted', async () => {
    grant(['schedule:read']);

    renderWithProviders(<InstitutionNav institutionId={INSTITUTION} />);

    expect(await screen.findByRole('link', { name: 'Calendar' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/calendar`,
    );
    expect(screen.getByRole('link', { name: 'Exams' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/exams`,
    );
  });

  it('hides a screen the server did not grant rather than offering a refusal', async () => {
    grant(['enrollment:read']);

    renderWithProviders(<InstitutionNav institutionId={INSTITUTION} />);

    expect(await screen.findByRole('link', { name: 'Courses' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Roles' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Calendar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Exams' })).not.toBeInTheDocument();
  });

  it('always keeps the dashboard reachable, permissions or not', async () => {
    grant([]);

    renderWithProviders(<InstitutionNav institutionId={INSTITUTION} />);

    expect(await screen.findByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('marks the open screen as current', async () => {
    pathname.value = `/institutions/${INSTITUTION}/grades`;

    renderWithProviders(<InstitutionNav institutionId={INSTITUTION} />);

    expect(await screen.findByRole('link', { name: 'Grades' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // The dashboard is a prefix of every other tab and must not match loosely.
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
      'aria-current',
    );

    pathname.value = `/institutions/${INSTITUTION}`;
  });
});
