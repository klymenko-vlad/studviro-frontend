import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { StudentDashboard } from './student-dashboard';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const COURSES_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/courses`;
const RESULTS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/course-results`;

function renderDashboard(props?: { canReadCourses?: boolean; canReadGrades?: boolean }) {
  return renderWithProviders(
    <StudentDashboard
      institutionId={INSTITUTION}
      canReadCourses={props?.canReadCourses ?? true}
      canReadGrades={props?.canReadGrades ?? true}
    />,
  );
}

describe('StudentDashboard', () => {
  it('summarises the current term rather than every term enrolled', async () => {
    renderDashboard();

    expect(await screen.findByTestId('dashboard-courses-summary')).toHaveTextContent(
      /course.*credits/,
    );
    expect(screen.getByText('Current courses')).toBeInTheDocument();
  });

  it('summarises credits earned and the weighted average', async () => {
    renderDashboard();

    expect(await screen.findByTestId('dashboard-grades-summary')).toHaveTextContent(
      '6 credits earned · weighted average 1.00',
    );
  });

  it('counts how many results are official', async () => {
    renderDashboard();

    expect(await screen.findByText(/of .* results are official\./)).toBeInTheDocument();
  });

  it('links through to the full courses and grades screens', async () => {
    renderDashboard();

    expect(await screen.findByRole('link', { name: 'All my courses' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses`,
    );
    expect(screen.getByRole('link', { name: 'All my grades' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/grades`,
    );
  });

  it('shows only the tiles the caller is allowed to read', async () => {
    renderDashboard({ canReadGrades: false });

    expect(await screen.findByText('Current courses')).toBeInTheDocument();
    expect(screen.queryByText('Results')).not.toBeInTheDocument();
  });

  it('explains a member who may read neither courses nor grades', () => {
    renderDashboard({ canReadCourses: false, canReadGrades: false });

    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument();
    expect(screen.queryByText('Current courses')).not.toBeInTheDocument();
  });

  it('explains an empty enrolment and result list instead of a bare tile', async () => {
    server.use(
      http.get(COURSES_URL, () => HttpResponse.json([])),
      http.get(RESULTS_URL, () => HttpResponse.json([])),
    );

    renderDashboard();

    expect(
      await screen.findByText('You are not enrolled in any course yet.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No result has been recorded for you yet.'),
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
    expect(await screen.findByTestId('dashboard-grades-summary')).toBeInTheDocument();
  });
});
