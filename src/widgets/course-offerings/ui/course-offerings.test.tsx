import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  permissions,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  within,
} from '@/shared/test';

import { CourseOfferings } from './course-offerings';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;

const render = () => renderWithProviders(<CourseOfferings institutionId={INSTITUTION} />);

/** Both selects fill from their own query, so the options arrive a tick later. */
async function chooseCourseAndTerm() {
  const course = await screen.findByLabelText('Course');
  await screen.findByRole('option', { name: 'INF/ALG/22 — Algorithms' });
  await userEvent.selectOptions(course, 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2');

  const term = screen.getByLabelText('Term');
  await userEvent.selectOptions(term, 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1');
}

const readOnly = () => {
  server.use(
    http.get(`${BASE}/me/permissions`, () =>
      HttpResponse.json({
        ...permissions,
        roles: ['student'],
        permissions: ['institution:read', 'offering:read'],
      }),
    ),
  );
};

describe('CourseOfferings', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('groups what is on offer under its term', async () => {
    render();

    const table = await screen.findByTestId('offerings-table');

    expect(within(table).getByText('Winter semester 2026/2027')).toBeInTheDocument();
    expect(within(table).getByText('Algorithms')).toBeInTheDocument();
    expect(within(table).getByText('Databases')).toBeInTheDocument();
  });

  it('says a full offering is full and an unstaffed one has no teacher', async () => {
    render();

    const table = await screen.findByTestId('offerings-table');
    const algorithms = within(table).getByText('Algorithms').closest('tr');
    const databases = within(table).getByText('Databases').closest('tr');

    expect(within(algorithms!).getByText('Full')).toBeInTheDocument();
    expect(within(algorithms!).getByText('60 of 60')).toBeInTheDocument();
    expect(within(databases!).getByText('No teacher')).toBeInTheDocument();
    expect(within(databases!).getByText('0 enrolled · no limit')).toBeInTheDocument();
  });

  it('puts a course on in a term', async () => {
    render();

    await chooseCourseAndTerm();
    await userEvent.click(screen.getByRole('button', { name: 'Put on offer' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('The offering was added.');
    });
  });

  it('puts a course already on that term on the course field', async () => {
    server.use(
      http.post(`${BASE}/course-offerings`, () =>
        HttpResponse.json(
          errorResponse(409, 'That course is already on offer in that term', 'Conflict'),
          { status: 409 },
        ),
      ),
    );

    render();
    await chooseCourseAndTerm();
    await userEvent.click(screen.getByRole('button', { name: 'Put on offer' }));

    expect(
      await screen.findByText('That course is already on offer in that term'),
    ).toBeInTheDocument();
  });

  it('explains why an offering with students cannot be retired', async () => {
    server.use(
      http.delete(`${BASE}/course-offerings/:offeringId`, () =>
        HttpResponse.json(
          errorResponse(
            409,
            'Students are enrolled on this offering; cancel it instead of retiring it',
            'Conflict',
          ),
          { status: 409 },
        ),
      ),
    );

    render();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Retire INF/ALG/22 2026W' }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Students are enrolled on this offering; cancel it instead of retiring it',
      );
    });
  });

  it('says what is missing when there is no course or no term to pair', async () => {
    server.use(
      http.get(`${BASE}/courses`, () => HttpResponse.json([])),
      http.get(`${BASE}/academic-terms`, () => HttpResponse.json([])),
    );

    render();

    expect(
      await screen.findByText(
        'Add a course and an academic term first; an offering is the pairing of the two.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the offerings but no controls without offering:manage', async () => {
    readOnly();
    render();

    expect(await screen.findByText('Algorithms')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Put on offer' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retire/ })).not.toBeInTheDocument();
  });
});
