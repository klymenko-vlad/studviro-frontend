import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  studyProgress,
} from '@/shared/test';

import { MyGrades } from './my-grades';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const RESULTS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/course-results`;
const SUMMARY_URL = `${RESULTS_URL}/summary`;

const render = () => renderWithProviders(<MyGrades institutionId={INSTITUTION} />);

describe('MyGrades', () => {
  it('names every result under the term that produced it', async () => {
    renderWithProviders(<MyGrades institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('heading', { name: 'Summer 2026', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Winter 2025', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    expect(screen.getByText('Databases')).toBeInTheDocument();
  });

  it('shows the calculated, proposed and official grade side by side', async () => {
    renderWithProviders(<MyGrades institutionId={INSTITUTION} />);

    expect(await screen.findByText('B · 87.5 points')).toBeInTheDocument();
    expect(screen.getByText('B on Jun 1, 2026')).toBeInTheDocument();
    expect(screen.getByText('A on Jun 10, 2026')).toBeInTheDocument();
  });

  it('names the system a result came from and flags one out of sync', async () => {
    renderWithProviders(<MyGrades institutionId={INSTITUTION} />);

    expect(await screen.findByText('Student information system')).toBeInTheDocument();
    expect(screen.getByText('In sync')).toBeInTheDocument();
    expect(screen.getByText('Conflict')).toBeInTheDocument();
    expect(
      screen.getByText('The source system reports a different mark.'),
    ).toBeInTheDocument();
  });

  it('labels the effective grade with the kind that produced it', async () => {
    renderWithProviders(<MyGrades institutionId={INSTITUTION} />);

    expect(await screen.findByLabelText('A, Official')).toBeInTheDocument();
    expect(screen.getByLabelText('C, Proposed')).toBeInTheDocument();
  });

  it('counts credits from published results only', async () => {
    renderWithProviders(<MyGrades institutionId={INSTITUTION} />);

    expect(await screen.findByTestId('my-grades-summary')).toHaveTextContent(
      '6 credits earned · weighted average 1.00',
    );
  });

  it('explains an empty result list instead of rendering a bare page', async () => {
    server.use(http.get(RESULTS_URL, () => HttpResponse.json([])));

    renderWithProviders(<MyGrades institutionId={INSTITUTION} />);

    expect(
      await screen.findByText('No result has been recorded for you yet.'),
    ).toBeInTheDocument();
  });

  it('reports a failure instead of an empty state', async () => {
    server.use(
      http.get(RESULTS_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderWithProviders(<MyGrades institutionId={INSTITUTION} />);

    expect(await screen.findByText('Grades could not be loaded')).toBeInTheDocument();
    expect(
      screen.queryByText('No result has been recorded for you yet.'),
    ).not.toBeInTheDocument();
  });

  describe('the study-progress summary', () => {
    it('reports the server’s credit total and average rather than computing its own', async () => {
      render();

      expect(await screen.findByTestId('my-grades-summary')).toHaveTextContent(
        /6 credits/i,
      );
    });

    it('says how many courses are awaiting a resit when any are', async () => {
      server.use(
        http.get(SUMMARY_URL, () =>
          HttpResponse.json({ ...studyProgress, awaitingRetake: 2, failedCourses: 2 }),
        ),
      );
      render();

      expect(await screen.findByTestId('my-grades-retakes')).toHaveTextContent(
        /2 courses are awaiting a resit/i,
      );
    });

    it('stays silent about resits when none are owed', async () => {
      render();

      await screen.findByTestId('my-grades-summary');

      expect(screen.queryByTestId('my-grades-retakes')).not.toBeInTheDocument();
    });

    it('still lists the results when the summary itself fails', async () => {
      server.use(http.get(SUMMARY_URL, () => new HttpResponse(null, { status: 500 })));
      render();

      expect(await screen.findByText('Algorithms')).toBeInTheDocument();
      expect(screen.queryByTestId('my-grades-summary')).not.toBeInTheDocument();
    });
  });
});
