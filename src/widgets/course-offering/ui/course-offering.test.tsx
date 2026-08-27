import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  courseOffering,
  errorResponse,
  renderWithProviders,
  screen,
  server,
  within,
} from '@/shared/test';

import { CourseOffering } from './course-offering';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
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
});
