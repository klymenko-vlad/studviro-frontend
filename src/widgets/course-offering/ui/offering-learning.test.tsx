import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  permissions,
  renderAndAudit,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingLearning } from './offering-learning';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;
const SPACES_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces`;

const panel = (viewerRole: 'student' | 'teacher' | 'administrator' = 'administrator') => (
  <OfferingLearning
    institutionId={INSTITUTION}
    offeringId={OFFERING}
    courseTitle="Algorithms"
    viewerRole={viewerRole}
  />
);

const grant = (granted: string[]) => {
  server.use(
    http.get(PERMISSIONS_URL, () =>
      HttpResponse.json({ ...permissions, permissions: granted }),
    ),
  );
};

const noSpace = () => {
  server.use(
    http.get(SPACES_URL, () =>
      HttpResponse.json({ total: 0, linked: 0, unlinked: 0, spaces: [] }),
    ),
  );
};

describe('OfferingLearning', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('shows the course page authored against this offering', async () => {
    renderWithProviders(panel());

    expect(await screen.findByText('Algorithms, winter 2026')).toBeInTheDocument();
    expect(
      screen.getAllByText('Complexity, design techniques and their analysis.').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('offers to open a course page when the offering has none', async () => {
    noSpace();

    renderWithProviders(panel());

    expect(
      await screen.findByRole('button', { name: 'Open the course page' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Algorithms');
  });

  it('tells a reader who may not author that there is no page, rather than offering one', async () => {
    grant(['offering:read']);
    noSpace();

    renderWithProviders(panel('student'));

    expect(
      await screen.findByText('This course has no course page yet.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open the course page' }),
    ).not.toBeInTheDocument();
  });

  it('keeps the settings form away from a reader who may not author', async () => {
    grant(['offering:read']);

    renderWithProviders(panel('student'));

    expect(await screen.findByText('Algorithms, winter 2026')).toBeInTheDocument();
    expect(
      screen.queryByRole('form', { name: 'Course page settings' }),
    ).not.toBeInTheDocument();
  });

  it('renames the page and reports it saved', async () => {
    const { user } = renderWithProviders(panel());

    const settings = await screen.findByRole('form', { name: 'Course page settings' });
    const name = within(settings).getByRole('textbox', { name: 'Name' });

    await user.clear(name);
    await user.type(name, 'Algorithms, renamed');
    await user.click(
      within(settings).getByRole('button', { name: 'Save the course page' }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Course page saved');
    });
  });

  it('reports a server failure rather than an empty panel', async () => {
    server.use(http.get(SPACES_URL, () => new HttpResponse(null, { status: 500 })));

    renderWithProviders(panel());

    expect(
      await screen.findByText(
        'The course page could not be loaded. Try again in a moment.',
      ),
    ).toBeInTheDocument();
  });

  it('has no accessibility violations once the whole course page has loaded', async () => {
    await renderAndAudit(panel(), async () => {
      await screen.findByText('Algorithms, winter 2026');
      await screen.findByText('Lecture 1 — slides');
      await screen.findByText('Assignment 1 — sorting');
    });
  });
});
