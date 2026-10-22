import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  teachingOfferings,
} from '@/shared/test';

import { TeachingTile } from './teaching-tile';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const TEACHING_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/teaching-offerings`;
const DURING_SUMMER = new Date('2026-04-01T09:00:00.000Z');

describe('TeachingTile', () => {
  it('summarises the courses taught this term and the students on them', async () => {
    renderWithProviders(<TeachingTile institutionId={INSTITUTION} now={DURING_SUMMER} />);

    expect(await screen.findByTestId('dashboard-teaching-summary')).toHaveTextContent(
      /\d+ courses? · \d+ students?/,
    );
    expect(screen.getByText(/Summer 2026 · from/)).toBeInTheDocument();
  });

  it('links each course taught to its course page', async () => {
    renderWithProviders(<TeachingTile institutionId={INSTITUTION} now={DURING_SUMMER} />);

    expect(await screen.findByRole('link', { name: /Algorithms/ })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses/${teachingOfferings[0]!.offering.id}`,
    );
  });

  it('shows the term running now ahead of a later one already on the books', async () => {
    const later = teachingOfferings.map(offering => ({
      ...offering,
      assignmentId: offering.assignmentId.replace('eeeeeee1', 'eeeeeee9'),
      course: { ...offering.course, title: `${offering.course.title} II` },
      term: {
        ...offering.term,
        id: 'ccccccc9-cccc-4ccc-8ccc-ccccccccccc9',
        name: 'Winter 2026',
        startsAt: '2026-09-21T00:00:00.000Z',
        endsAt: '2027-02-14T00:00:00.000Z',
      },
    }));
    server.use(
      http.get(TEACHING_URL, () => HttpResponse.json([...later, ...teachingOfferings])),
    );

    renderWithProviders(<TeachingTile institutionId={INSTITUTION} now={DURING_SUMMER} />);

    expect(await screen.findByText(/Summer 2026 · from/)).toBeInTheDocument();
    expect(screen.queryByText('Algorithms II')).not.toBeInTheDocument();
  });

  it('says so when nothing is taught', async () => {
    server.use(http.get(TEACHING_URL, () => HttpResponse.json([])));

    renderWithProviders(<TeachingTile institutionId={INSTITUTION} now={DURING_SUMMER} />);

    expect(
      await screen.findByText('You are not assigned to teach any course yet.'),
    ).toBeInTheDocument();
  });

  it('reports a failed read rather than an empty tile', async () => {
    server.use(
      http.get(TEACHING_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom', 'Internal Server Error'), {
          status: 500,
        }),
      ),
    );

    renderWithProviders(<TeachingTile institutionId={INSTITUTION} now={DURING_SUMMER} />);

    expect(
      await screen.findByText('Your teaching is unavailable right now.'),
    ).toBeInTheDocument();
  });
});
