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

import { OfferingAssignmentsSection, OfferingLearning } from './offering-learning';

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
      HttpResponse.json({ total: 0, offeringsWithoutPage: 1, spaces: [] }),
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

  it('lets the teacher of the course open its page, with no administrator involved', async () => {
    grant(['offering:read']);
    noSpace();

    renderWithProviders(panel('teacher'));

    expect(
      await screen.findByRole('button', { name: 'Open the course page' }),
    ).toBeInTheDocument();
  });

  it('gives that teacher the settings form on a page that already exists', async () => {
    grant(['offering:read']);

    renderWithProviders(panel('teacher'));

    expect(
      await screen.findByRole('form', { name: 'Course page settings' }),
    ).toBeInTheDocument();
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
    });
  });

  it('places an assignment in the outline as a link, leaving its brief to its own tab', async () => {
    renderWithProviders(panel());

    expect(
      await screen.findByRole('link', { name: 'Assignment 1 — sorting' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Implement and compare three sorts.'),
    ).not.toBeInTheDocument();
  });
});

describe('OfferingAssignmentsSection', () => {
  const section = (viewerRole: 'student' | 'teacher' | 'administrator' = 'student') => (
    <OfferingAssignmentsSection
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      viewerRole={viewerRole}
    />
  );

  it('lists the course’s assignments', async () => {
    await renderAndAudit(section(), async () => {
      await screen.findByText('Assignment 1 — sorting');
    });
  });

  it('points an author at the materials tab when the course page does not exist yet', async () => {
    server.use(http.get(SPACES_URL, () => HttpResponse.json([])));
    renderWithProviders(section('teacher'));

    expect(await screen.findByText('No assignments yet.')).toBeInTheDocument();
    expect(screen.getByText(/Open it on the Materials tab first/)).toBeInTheDocument();
  });
});
