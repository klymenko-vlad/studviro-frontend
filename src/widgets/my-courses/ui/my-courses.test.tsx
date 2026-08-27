import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { MyCourses } from './my-courses';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const COURSES_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/courses`;

describe('MyCourses', () => {
  it('names every enrolled course under the term that runs it', async () => {
    renderWithProviders(<MyCourses institutionId={INSTITUTION} />);

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
    renderWithProviders(<MyCourses institutionId={INSTITUTION} />);

    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Compulsory')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('says so when a course records no teacher', async () => {
    renderWithProviders(<MyCourses institutionId={INSTITUTION} />);

    expect(await screen.findByText('No teacher recorded')).toBeInTheDocument();
  });

  it('marks a repeated attempt and leaves a first attempt unmarked', async () => {
    renderWithProviders(<MyCourses institutionId={INSTITUTION} />);

    expect(await screen.findByText('Attempt 2')).toBeInTheDocument();
    expect(screen.queryByText('Attempt 1')).not.toBeInTheDocument();
  });

  it('explains an empty enrolment list instead of rendering a bare page', async () => {
    server.use(http.get(COURSES_URL, () => HttpResponse.json([])));

    renderWithProviders(<MyCourses institutionId={INSTITUTION} />);

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

    renderWithProviders(<MyCourses institutionId={INSTITUTION} />);

    expect(await screen.findByText('Courses could not be loaded')).toBeInTheDocument();
    expect(
      screen.queryByText('You are not enrolled in any course yet.'),
    ).not.toBeInTheDocument();
  });
});
