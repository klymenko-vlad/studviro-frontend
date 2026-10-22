import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import {
  courseOffering,
  errorResponse,
  permissions,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@/shared/test';

import { CourseOffering } from './course-offering';

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
const RESULTS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/course-results`;
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;
const OFFERING_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/course-offerings/${OFFERING}`;

const render = () =>
  renderWithProviders(
    <CourseOffering institutionId={INSTITUTION} offeringId={OFFERING} />,
  );

describe('CourseOffering', () => {
  it('names the course, its code and the term that runs it', async () => {
    render();

    expect(
      await screen.findByRole('heading', { name: 'Algorithms', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('INF/ALG/22')).toBeInTheDocument();
    expect(screen.getByText('Summer 2026')).toBeInTheDocument();
    expect(
      screen.getByText('Complexity, design techniques and their analysis.'),
    ).toBeInTheDocument();
  });

  it('lists the teaching staff, the course lead first', async () => {
    render();

    const staff = await screen.findByRole('list', { name: 'Teaching staff' });

    expect(
      within(staff)
        .getAllByRole('listitem')
        .map(item => item.textContent),
    ).toHaveLength(2);
    expect(within(staff).getAllByRole('listitem')[0]).toHaveTextContent('Ada Lovelace');
  });

  it('shows the caller’s own enrolment and study group', async () => {
    render();

    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Compulsory')).toBeInTheDocument();
    expect(screen.getByText('Monday seminar')).toBeInTheDocument();
  });

  it('says so when the caller has no enrolment of their own', async () => {
    server.use(
      http.get(OFFERING_URL, () =>
        HttpResponse.json({
          ...courseOffering,
          enrollment: null,
          studyGroups: [],
          viewerRole: 'teacher',
        }),
      ),
    );

    render();

    expect(
      await screen.findByText('You are not enrolled in this course.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No study group of your own.')).toBeInTheDocument();
  });

  it('explains a refusal rather than showing an empty page', async () => {
    server.use(
      http.get(OFFERING_URL, () =>
        HttpResponse.json(errorResponse(403, 'Denied', 'Forbidden'), { status: 403 }),
      ),
    );

    render();

    expect(
      await screen.findByText('This course is not yours to see'),
    ).toBeInTheDocument();
  });

  it('reports a course that does not exist', async () => {
    server.use(
      http.get(OFFERING_URL, () =>
        HttpResponse.json(errorResponse(404, 'Missing', 'Not Found'), { status: 404 }),
      ),
    );

    render();

    expect(await screen.findByText('Course not found')).toBeInTheDocument();
  });

  it('shows the caller’s result for this offering with where it came from', async () => {
    const { user } = renderWithProviders(
      <CourseOffering institutionId={INSTITUTION} offeringId={OFFERING} />,
    );

    await user.click(await screen.findByRole('tab', { name: 'Assessment' }));

    expect(await screen.findByText('My result')).toBeInTheDocument();
    expect(await screen.findByText('B · 87.5 points')).toBeInTheDocument();
  });

  it('says so when no result has been recorded for the offering', async () => {
    server.use(http.get(RESULTS_URL, () => HttpResponse.json([])));

    const { user } = renderWithProviders(
      <CourseOffering institutionId={INSTITUTION} offeringId={OFFERING} />,
    );

    await user.click(await screen.findByRole('tab', { name: 'Assessment' }));

    expect(
      await screen.findByText('No result has been recorded for this course yet.'),
    ).toBeInTheDocument();
  });

  it('lists the exam terms of this course and links to all of them', async () => {
    const { user } = render();

    await user.click(await screen.findByRole('tab', { name: 'Schedule' }));

    expect(await screen.findByText('Exam terms')).toBeInTheDocument();
    expect(await screen.findByText('Examiner: Alan Turing')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all exams' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/exams`,
    );
  });

  it('hides the exam panel from a reader without schedule:read', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({ ...permissions, permissions: ['offering:read'] }),
      ),
    );

    render();

    expect(
      await screen.findByRole('heading', { name: 'Algorithms', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Exam terms')).not.toBeInTheDocument();
  });

  it('shows the roster to a teacher of the offering', async () => {
    server.use(
      http.get(OFFERING_URL, () =>
        HttpResponse.json({ ...courseOffering, viewerRole: 'teacher' }),
      ),
    );

    const { user } = render();

    await user.click(await screen.findByRole('tab', { name: 'People' }));

    expect(await screen.findByText('Roster')).toBeInTheDocument();

    // Scoped to the roster: the study-group panel shares this section and
    // names the same people.
    const roster = await screen.findByRole('region', {
      name: 'Students enrolled in this course offering',
    });

    await waitFor(() => {
      expect(within(roster).getByText('Ada Lovelace')).toBeInTheDocument();
    });
  });

  it('hides the roster from a student, who may not see their classmates', async () => {
    render();

    expect(
      await screen.findByRole('heading', { name: 'Algorithms', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'People' })).not.toBeInTheDocument();
    expect(screen.queryByText('Roster')).not.toBeInTheDocument();
  });

  it('offers a teacher the sections a student does not get', async () => {
    server.use(
      http.get(OFFERING_URL, () =>
        HttpResponse.json({ ...courseOffering, viewerRole: 'teacher' }),
      ),
    );

    render();

    expect(await screen.findByRole('tab', { name: 'People' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'data-state',
      'active',
    );
  });
});
