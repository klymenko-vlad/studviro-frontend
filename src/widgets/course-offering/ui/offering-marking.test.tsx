import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  offeringAssignments,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingMarking } from './offering-marking';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const ASSIGNMENT = offeringAssignments[0]!;
const SUBMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/assignments/${ASSIGNMENT.id}/submissions`;

const render = () =>
  renderWithProviders(
    <OfferingMarking institutionId={INSTITUTION} assignment={ASSIGNMENT} />,
  );

describe('OfferingMarking', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('lists every submission on the assignment, with its student', async () => {
    render();

    const table = await screen.findByRole('table', {
      name: 'Submissions for Assignment 1 — sorting',
    });

    expect(within(table).getByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(table).getByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('2 submissions')).toBeInTheDocument();
  });

  it('marks the late submission as the server marked it', async () => {
    render();

    const table = await screen.findByRole('table', {
      name: 'Submissions for Assignment 1 — sorting',
    });

    expect(within(table).getAllByText('Late')).toHaveLength(1);
  });

  it('records points and feedback for one submission', async () => {
    const { user } = render();

    const form = await screen.findByRole('form', { name: "Mark Ada Lovelace's work" });

    await user.type(
      within(form).getByRole('spinbutton', { name: 'Points of 100' }),
      '75',
    );
    await user.type(
      within(form).getByRole('textbox', { name: 'Feedback' }),
      'Good, but late.',
    );
    await user.click(within(form).getByRole('button', { name: 'Save the mark' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Ada Lovelace's work was marked");
    });
  });

  it('shows a refusal against the points field rather than swallowing it', async () => {
    server.use(
      http.put(`${SUBMISSIONS_URL}/:submissionId/mark`, () =>
        HttpResponse.json(
          errorResponse(409, 'More points than the assignment carries', 'Conflict'),
          { status: 409 },
        ),
      ),
    );

    const { user } = render();

    const form = await screen.findByRole('form', { name: "Mark Ada Lovelace's work" });

    await user.type(
      within(form).getByRole('spinbutton', { name: 'Points of 100' }),
      '500',
    );
    await user.click(within(form).getByRole('button', { name: 'Save the mark' }));

    expect(
      await screen.findByText('More points than the assignment carries'),
    ).toBeInTheDocument();
  });

  it('says so when nobody has handed anything in', async () => {
    server.use(http.get(SUBMISSIONS_URL, () => HttpResponse.json([])));

    render();

    expect(
      await screen.findByText('Nobody has handed anything in yet.'),
    ).toBeInTheDocument();
  });

  it('reports a server failure rather than an empty table', async () => {
    server.use(http.get(SUBMISSIONS_URL, () => new HttpResponse(null, { status: 500 })));

    render();

    expect(
      await screen.findByText('Submissions could not be loaded. Try again in a moment.'),
    ).toBeInTheDocument();
  });
});
