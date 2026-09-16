import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  errorResponse,
  permissions,
  renderWithProviders,
  screen,
  server,
} from '@/shared/test';

import { OfferingAssessments } from './offering-assessments';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
const URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/assessment-results`;
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

const render = () =>
  renderWithProviders(
    <OfferingAssessments institutionId={INSTITUTION} offeringId={OFFERING} />,
  );

describe('OfferingAssessments', () => {
  it('lists the marks the learning system recorded, with their share of the maximum', async () => {
    render();

    expect(await screen.findByText('Assignment 1')).toBeInTheDocument();
    expect(screen.getByText('72 of 100')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('shows the hand-in and completion the mark was awarded on', async () => {
    render();

    expect(await screen.findByText('Graded')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('says a column is unmarked rather than inventing a zero', async () => {
    render();

    expect(await screen.findByText('Not marked yet')).toBeInTheDocument();
  });

  it('flags a column that does not count toward the final grade', async () => {
    render();

    expect(
      await screen.findByText('Does not count toward the final grade'),
    ).toBeInTheDocument();
  });

  it('says so when no mark has been recorded yet', async () => {
    server.use(http.get(URL, () => HttpResponse.json([])));
    render();

    expect(
      await screen.findByText('No mark has been recorded for you in this course yet.'),
    ).toBeInTheDocument();
  });

  it('reports a failure instead of an empty table', async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json(errorResponse(500, 'Internal server error'), { status: 500 }),
      ),
    );
    render();

    expect(
      await screen.findByText('Marks could not be loaded. Try again in a moment.'),
    ).toBeInTheDocument();
  });

  it('renders nothing at all to a caller without grade:read', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({
          ...permissions,
          permissions: permissions.permissions.filter(entry => entry !== 'grade:read'),
        }),
      ),
    );

    const { container } = render();

    await screen.findByTestId('offering-assessments-loading').catch(() => null);

    expect(container).toBeEmptyDOMElement();
  });
});
