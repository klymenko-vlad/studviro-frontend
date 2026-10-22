import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import {
  permissions,
  renderAndAudit,
  renderWithProviders,
  screen,
  server,
  userEvent,
  within,
} from '@/shared/test';

import { InstitutionFrame } from './institution-frame';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

const pathname = vi.hoisted(() => ({
  value: '/institutions/55555555-5555-4555-8555-555555555555',
}));

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  usePathname: () => pathname.value,
}));

function signInAs(roles: string[], granted: string[]) {
  server.use(
    http.get(PERMISSIONS_URL, () =>
      HttpResponse.json({ ...permissions, roles, permissions: granted }),
    ),
  );
}

function renderFrame() {
  return renderWithProviders(
    <InstitutionFrame institutionId={INSTITUTION}>
      <main id="main-content">content</main>
    </InstitutionFrame>,
  );
}

async function sidebar() {
  await screen.findAllByRole('link', { name: 'Home' });
  return within(screen.getByRole('navigation', { name: 'Institution sections' }));
}

async function tabBar() {
  return within(await screen.findByRole('navigation', { name: 'Main sections' }));
}

describe('InstitutionFrame', () => {
  afterEach(() => {
    pathname.value = `/institutions/${INSTITUTION}`;
  });

  it('renders the page beside the sections', async () => {
    renderFrame();

    expect(screen.getByText('content')).toBeInTheDocument();
    expect((await sidebar()).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}`,
    );
  });

  it('groups an administrator’s screens under Administration', async () => {
    renderFrame();

    const nav = await sidebar();
    const administration = nav.getByRole('list', { name: 'Administration' });

    expect(
      within(administration).getByRole('link', { name: 'Teaching offer' }),
    ).toHaveAttribute('href', `/institutions/${INSTITUTION}/offer`);
    expect(
      within(administration).getByRole('link', { name: 'Institution' }),
    ).toBeInTheDocument();
    expect(nav.queryByRole('list', { name: 'My studies' })).not.toBeInTheDocument();
  });

  it('gives a student their studies and no administration', async () => {
    signInAs(
      ['student'],
      [
        'institution:read',
        'enrollment:read',
        'grade:read',
        'schedule:read',
        'course:enroll',
      ],
    );

    renderFrame();

    const nav = await sidebar();
    const studies = nav.getByRole('list', { name: 'My studies' });

    expect(within(studies).getByRole('link', { name: 'Courses' })).toBeInTheDocument();
    expect(within(studies).getByRole('link', { name: 'Grades' })).toBeInTheDocument();
    expect(nav.queryByRole('list', { name: 'Administration' })).not.toBeInTheDocument();
    expect(nav.queryByRole('link', { name: 'My teaching' })).not.toBeInTheDocument();
  });

  it('gives a teacher their teaching rather than a student’s screens', async () => {
    signInAs(
      ['teacher'],
      ['institution:read', 'enrollment:read', 'grade:read', 'grade:propose', 'role:read'],
    );

    renderFrame();

    const nav = await sidebar();

    expect(nav.getByRole('link', { name: 'My teaching' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/teaching`,
    );
    expect(nav.queryByRole('link', { name: 'Courses' })).not.toBeInTheDocument();
    expect(nav.queryByRole('link', { name: 'People' })).not.toBeInTheDocument();
  });

  it('marks the open screen as current, and the dashboard only on itself', async () => {
    pathname.value = `/institutions/${INSTITUTION}/programs/some-programme`;

    renderFrame();

    const nav = await sidebar();

    // A programme's page counts as the teaching offer it is listed in.
    expect(nav.getByRole('link', { name: 'Teaching offer' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(nav.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('opens every section in a sheet from the tab bar, and closes it on navigation', async () => {
    const user = userEvent.setup();
    renderFrame();

    await user.click((await tabBar()).getByRole('button', { name: 'More' }));

    const sheet = await screen.findByRole('dialog', { name: 'Sections' });
    await user.click(within(sheet).getByRole('link', { name: 'Teaching offer' }));

    expect(screen.queryByRole('dialog', { name: 'Sections' })).not.toBeInTheDocument();
  });

  it('gives a phone four tabs and marks the open one', async () => {
    renderFrame();

    const tabs = await tabBar();
    expect(tabs.getAllByRole('link')).toHaveLength(4);
    expect(tabs.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps a screen that is not a tab one tap away under More', async () => {
    pathname.value = `/institutions/${INSTITUTION}/audit`;
    renderFrame();

    const tabs = await tabBar();
    expect(tabs.queryByRole('link', { name: 'Audit trail' })).not.toBeInTheDocument();
    expect(tabs.getByRole('button', { name: 'More' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});

describe('InstitutionFrame accessibility', () => {
  it('has no axe violations', async () => {
    await renderAndAudit(
      <InstitutionFrame institutionId={INSTITUTION}>
        <main id="main-content">content</main>
      </InstitutionFrame>,
      () => screen.findAllByRole('link', { name: 'Home' }),
    );
  });
});
