import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  courseRoster,
  errorResponse,
  permissions,
  renderWithProviders,
  screen,
  server,
  within,
} from '@/shared/test';

import { OfferingRoster } from './offering-roster';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const ROSTER_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/course-offerings/${OFFERING}/roster`;

const render = () =>
  renderWithProviders(
    <OfferingRoster institutionId={INSTITUTION} offeringId={OFFERING} />,
  );

describe('OfferingRoster', () => {
  it('names each enrolled student with their status and study groups', async () => {
    render();

    const table = await screen.findByRole('table', {
      name: 'Students enrolled in this course offering',
    });
    expect(within(table).getByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(table).getByText('ada@example.com')).toBeInTheDocument();
    expect(within(table).getByText('S1')).toBeInTheDocument();
    expect(within(table).getByText('Completed')).toBeInTheDocument();
  });

  it('counts the students who still hold a place, not every row listed', async () => {
    render();

    expect(await screen.findByText(/2 enrolled of 2 listed/)).toBeInTheDocument();
  });

  it('offers a registrar a withdrawal for each student', async () => {
    server.use(
      http.get(`/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`, () =>
        HttpResponse.json({
          ...permissions,
          permissions: [...permissions.permissions, 'enrollment:manage'],
        }),
      ),
    );
    render();

    expect(
      await screen.findByRole('button', { name: 'Withdraw Ada Lovelace' }),
    ).toBeInTheDocument();
  });

  it('offers no withdrawal to someone who may not correct enrolments', async () => {
    render();

    await screen.findByRole('table', {
      name: 'Students enrolled in this course offering',
    });
    expect(screen.queryByRole('button', { name: /^Withdraw/ })).not.toBeInTheDocument();
  });

  it('says so when nobody is enrolled', async () => {
    server.use(
      http.get(ROSTER_URL, () => HttpResponse.json({ ...courseRoster, students: [] })),
    );

    render();

    expect(
      await screen.findByText('Nobody is enrolled in this offering yet.'),
    ).toBeInTheDocument();
  });

  it('reports a refused read rather than an empty roster', async () => {
    server.use(
      http.get(ROSTER_URL, () =>
        HttpResponse.json(errorResponse(403, 'Forbidden'), { status: 403 }),
      ),
    );

    render();

    expect(
      await screen.findByText(
        'The roster is unavailable right now. Try again in a moment.',
      ),
    ).toBeInTheDocument();
  });
});
