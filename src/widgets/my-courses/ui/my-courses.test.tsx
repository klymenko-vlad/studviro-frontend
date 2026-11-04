import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { MyCourses } from './my-courses';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const COURSES_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/courses`;
/** Winter 2025 is running and Summer 2026 is ahead: both are current. */
const AUTUMN = new Date('2025-11-15T12:00:00.000Z');
/** Inside Summer 2026, after Winter 2025 has ended. */
const SPRING = new Date('2026-03-15T12:00:00.000Z');

describe('MyCourses', () => {
  it('names every enrolled course under the term that runs it', async () => {
    renderWithProviders(<MyCourses institutionId={INSTITUTION} today={AUTUMN} />);

    expect(
      await screen.findByRole('heading', { name: 'Summer 2026', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Winter 2025', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    expect(screen.getByText('Databases')).toBeInTheDocument();
  });

  it('shows enrolment status, requirement and the teacher who leads the course', async () => {
    renderWithProviders(<MyCourses institutionId={INSTITUTION} today={AUTUMN} />);

    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Compulsory')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('says so when a course records no teacher', async () => {
    renderWithProviders(<MyCourses institutionId={INSTITUTION} today={AUTUMN} />);

    expect(await screen.findByText('No teacher recorded')).toBeInTheDocument();
  });

  it('marks a repeated attempt and leaves a first attempt unmarked', async () => {
    renderWithProviders(<MyCourses institutionId={INSTITUTION} today={AUTUMN} />);

    expect(await screen.findByText('Attempt 2')).toBeInTheDocument();
    expect(screen.queryByText('Attempt 1')).not.toBeInTheDocument();
  });

  it('links every course title to its course page', async () => {
    renderWithProviders(<MyCourses institutionId={INSTITUTION} today={AUTUMN} />);

    expect(await screen.findByRole('link', { name: 'Algorithms' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses/aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1`,
    );
  });

  it('explains an empty enrolment list instead of rendering a bare page', async () => {
    server.use(http.get(COURSES_URL, () => HttpResponse.json([])));

    renderWithProviders(<MyCourses institutionId={INSTITUTION} today={AUTUMN} />);

    expect(
      await screen.findByText('You are not enrolled in any course yet.'),
    ).toBeInTheDocument();
  });

  it('reports a failure instead of an empty state', async () => {
    server.use(
      http.get(COURSES_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderWithProviders(<MyCourses institutionId={INSTITUTION} today={AUTUMN} />);

    expect(await screen.findByText('Courses could not be loaded')).toBeInTheDocument();
    expect(
      screen.queryByText('You are not enrolled in any course yet.'),
    ).not.toBeInTheDocument();
  });

  it('folds finished terms away behind one row, and opens them on request', async () => {
    const { user } = renderWithProviders(
      <MyCourses institutionId={INSTITUTION} today={SPRING} />,
    );

    expect(
      await screen.findByRole('heading', { name: 'Summer 2026', level: 2 }),
    ).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: /Earlier courses/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: 'Winter 2025', level: 3 })).toBeVisible();
  });

  it('leaves out a course the student left or was refused', async () => {
    server.use(
      http.get(COURSES_URL, async () => {
        const { enrolledCourses } = await import('@/shared/test');
        return HttpResponse.json(
          enrolledCourses.map(course => ({ ...course, status: 'withdrawn' })),
        );
      }),
    );
    renderWithProviders(<MyCourses institutionId={INSTITUTION} today={AUTUMN} />);

    expect(
      await screen.findByText('You are not enrolled in any course yet.'),
    ).toBeInTheDocument();
  });
});
