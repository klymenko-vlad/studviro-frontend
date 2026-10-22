import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { MyTeaching } from './my-teaching';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const TEACHING_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/teaching-offerings`;

describe('MyTeaching', () => {
  it('names every taught offering under the term that runs it', async () => {
    renderWithProviders(<MyTeaching institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('heading', { name: 'Summer 2026', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Winter 2025', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    expect(screen.getByText('Databases')).toBeInTheDocument();
  });

  it('shows how many students are enrolled and the teaching role held', async () => {
    renderWithProviders(<MyTeaching institutionId={INSTITUTION} />);

    expect(await screen.findByText(/42 students enrolled/)).toBeInTheDocument();
    expect(screen.getByText('Lecturer')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('marks an offering nobody has enrolled in as empty rather than blank', async () => {
    renderWithProviders(<MyTeaching institutionId={INSTITUTION} />);

    expect(await screen.findByText(/0 students enrolled/)).toBeInTheDocument();
  });

  it('links each offering to its course page', async () => {
    renderWithProviders(<MyTeaching institutionId={INSTITUTION} />);

    expect(await screen.findByRole('link', { name: 'Algorithms' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses/aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1`,
    );
  });

  it('says so when the caller teaches nothing', async () => {
    server.use(http.get(TEACHING_URL, () => HttpResponse.json([])));

    renderWithProviders(<MyTeaching institutionId={INSTITUTION} />);

    expect(
      await screen.findByText('You are not assigned to teach any course offering yet.'),
    ).toBeInTheDocument();
  });

  it('reports a failed read rather than an empty list', async () => {
    server.use(
      http.get(TEACHING_URL, () =>
        HttpResponse.json(errorResponse(500, 'Internal server error'), { status: 500 }),
      ),
    );

    renderWithProviders(<MyTeaching institutionId={INSTITUTION} />);

    expect(await screen.findByText('Teaching could not be loaded')).toBeInTheDocument();
  });
});
