import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  courseResults,
  deadlines,
  errorResponse,
  renderWithProviders,
  screen,
  server,
  timetableEvents,
  within,
} from '@/shared/test';

import { StudiesSection } from './studies-section';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const COURSES_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/courses`;
const RESULTS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/course-results`;
const EVENTS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/timetable-events`;
const DEADLINES_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/deadlines`;

function renderDashboard(props?: {
  canReadCourses?: boolean;
  canReadGrades?: boolean;
  canReadSchedule?: boolean;
}) {
  return renderWithProviders(
    <StudiesSection
      institutionId={INSTITUTION}
      canReadCourses={props?.canReadCourses ?? true}
      canReadGrades={props?.canReadGrades ?? true}
      canReadSchedule={props?.canReadSchedule ?? true}
    />,
  );
}

describe('StudiesSection', () => {
  it('leads with what is due and when, before courses and results', async () => {
    renderDashboard();

    await screen.findByText('Current courses');
    const titles = screen
      .getAllByRole('heading', { level: 2 })
      .map(heading => heading.textContent);

    expect(titles).toEqual(['Deadlines', 'This week', 'Current courses', 'Results']);
  });

  it('opens with the student’s figures at a glance', async () => {
    renderDashboard();

    expect(await screen.findByRole('link', { name: /^This term/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Next deadline/ })).toBeInTheDocument();
  });

  it('marks a failed result apart from a passed one', async () => {
    server.use(
      http.get(RESULTS_URL, () =>
        HttpResponse.json([
          {
            ...courseResults[0],
            effective: { kind: 'official', grade: 'FX', passed: false },
          },
        ]),
      ),
    );

    renderDashboard();

    expect(await screen.findByText('FX')).toHaveAttribute('data-variant', 'destructive');
  });

  it('marks a grade still awaited as pending', async () => {
    server.use(
      http.get(RESULTS_URL, () =>
        HttpResponse.json([{ ...courseResults[0], effective: null }]),
      ),
    );

    renderDashboard();

    expect(await screen.findByText('Not graded')).toHaveAttribute('data-variant', 'outline');
  });

  it('counts how many results are official', async () => {
    renderDashboard();

    expect(await screen.findByText(/of .* results are official\./)).toBeInTheDocument();
  });

  it('counts what is left of the reader’s week', async () => {
    server.use(
      http.get(EVENTS_URL, () => HttpResponse.json(timetableEvents.slice(0, 2))),
    );

    renderDashboard();

    expect(await screen.findByTestId('dashboard-calendar-summary')).toHaveTextContent(
      '2 events left this week',
    );
  });

  it('counts what falls due in the reader’s next two weeks', async () => {
    server.use(http.get(DEADLINES_URL, () => HttpResponse.json(deadlines)));

    renderDashboard();

    expect(await screen.findByTestId('dashboard-deadlines-summary')).toHaveTextContent(
      '1 deadline in the next two weeks',
    );
    expect(screen.getByText(/Assignment 1/)).toBeInTheDocument();
  });

  it('says how soon each deadline falls due', async () => {
    server.use(http.get(DEADLINES_URL, () => HttpResponse.json(deadlines)));
    const due = Date.parse(deadlines[0]!.dueAt);

    renderWithProviders(
      <StudiesSection
        institutionId={INSTITUTION}
        canReadCourses={false}
        canReadGrades={false}
        canReadSchedule
        now={new Date(due - 26 * 60 * 60 * 1000)}
      />,
    );

    const tile = within(
      (await screen.findByRole('heading', { name: 'Deadlines' })).closest(
        '[data-slot="card"]',
      ) as HTMLElement,
    );
    expect(await tile.findByText('tomorrow')).toBeInTheDocument();
  });

  it('leaves a deadline that has already passed out of the tile', async () => {
    server.use(
      http.get(DEADLINES_URL, () =>
        HttpResponse.json(deadlines.map(due => ({ ...due, isOverdue: true }))),
      ),
    );

    renderDashboard();

    expect(
      await screen.findByText('Nothing falls due in the next two weeks.'),
    ).toBeInTheDocument();
  });

  it('reports a failed deadline read rather than an empty tile', async () => {
    server.use(
      http.get(DEADLINES_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderDashboard();

    expect(
      await screen.findByText('Your deadlines are unavailable right now.'),
    ).toBeInTheDocument();
  });

  it('links through to the full courses, grades and calendar screens', async () => {
    renderDashboard();

    expect(await screen.findByRole('link', { name: 'All my courses' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses`,
    );
    expect(screen.getByRole('link', { name: 'All my grades' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/grades`,
    );
    expect(screen.getByRole('link', { name: 'Full calendar' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/calendar`,
    );
  });

  it('shows only the tiles the caller is allowed to read', async () => {
    renderDashboard({ canReadGrades: false, canReadSchedule: false });

    expect(await screen.findByText('Current courses')).toBeInTheDocument();
    expect(screen.queryByText('Results')).not.toBeInTheDocument();
    expect(screen.queryByText('This week')).not.toBeInTheDocument();
    expect(screen.queryByText('Deadlines')).not.toBeInTheDocument();
  });

  it('explains a member who may read nothing the dashboard shows', () => {
    renderDashboard({
      canReadCourses: false,
      canReadGrades: false,
      canReadSchedule: false,
    });

    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument();
    expect(screen.queryByText('Current courses')).not.toBeInTheDocument();
  });

  it('explains an empty enrolment and result list instead of a bare tile', async () => {
    server.use(
      http.get(COURSES_URL, () => HttpResponse.json([])),
      http.get(RESULTS_URL, () => HttpResponse.json([])),
      http.get(EVENTS_URL, () => HttpResponse.json([])),
    );

    renderDashboard();

    expect(
      await screen.findByText('You are not enrolled in any course yet.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No result has been recorded for you yet.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Nothing is scheduled for the rest of this week.'),
    ).toBeInTheDocument();
  });

  it('reports a failing tile without taking down the other one', async () => {
    server.use(
      http.get(COURSES_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderDashboard();

    expect(
      await screen.findByText('Your courses are unavailable right now.'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Results')).toBeInTheDocument();
    expect(await screen.findByText('6 credits earned')).toBeInTheDocument();
  });
});

describe('StudiesSection beside a teaching section', () => {
  it('leaves the week to the section that already shows it', async () => {
    renderWithProviders(
      <StudiesSection
        institutionId={INSTITUTION}
        canReadCourses
        canReadGrades
        canReadSchedule
        showWeek={false}
      />,
    );

    expect(await screen.findByText('Current courses')).toBeInTheDocument();
    expect(screen.getByText('Deadlines')).toBeInTheDocument();
    expect(screen.queryByText('This week')).not.toBeInTheDocument();
  });
});
