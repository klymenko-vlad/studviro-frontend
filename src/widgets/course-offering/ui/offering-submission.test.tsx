import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  mySubmissions,
  offeringAssignments,
  renderWithProviders,
  screen,
  server,
  uploadTicket,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingSubmission } from './offering-submission';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const ASSIGNMENT = offeringAssignments[0]!;
const MINE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/assignments/${ASSIGNMENT.id}/submissions/mine`;

const render = (assignment = ASSIGNMENT) =>
  renderWithProviders(
    <OfferingSubmission institutionId={INSTITUTION} assignment={assignment} />,
  );

const zip = () => new File(['PK'], 'sorting.zip', { type: 'application/zip' });

const handIn = async (user: ReturnType<typeof renderWithProviders>['user']) => {
  const form = await screen.findByRole('form', { name: /Hand in your work/ });

  await user.upload(within(form).getByLabelText('Files'), zip());
  await user.click(within(form).getByRole('button', { name: /Hand in/ }));
};

describe('OfferingSubmission', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('shows the attempt the student made, with the files they handed in', async () => {
    render();

    expect(await screen.findByText('Attempt 1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Download sorting.zip' }),
    ).toBeInTheDocument();
  });

  it('renders lateness as the server decided it, and never recomputes it', async () => {
    render();

    expect(await screen.findByText('Late')).toBeInTheDocument();
    expect(screen.queryByText('On time')).not.toBeInTheDocument();
  });

  it('calls a submission on time when the server says so, whatever the clock says', async () => {
    server.use(
      http.get(MINE_URL, () =>
        HttpResponse.json([{ ...mySubmissions[0]!, isLate: false }]),
      ),
    );

    render();

    expect(await screen.findByText('On time')).toBeInTheDocument();
    expect(screen.queryByText('Late')).not.toBeInTheDocument();
  });

  it('shows the student the mark and the feedback on their work', async () => {
    server.use(
      http.get(MINE_URL, () =>
        HttpResponse.json([
          {
            ...mySubmissions[0]!,
            state: 'graded',
            mark: {
              points: 8,
              maxPoints: 10,
              feedback: 'Clear argument; cite the second source.',
              markedAt: '2026-10-03T09:00:00.000Z',
            },
          },
        ]),
      ),
    );

    render();

    expect(await screen.findByText('8 of 10 points')).toBeInTheDocument();
    expect(
      screen.getByText('Clear argument; cite the second source.'),
    ).toBeInTheDocument();
  });

  it('says how many attempts are left under the policy', async () => {
    render();

    expect(await screen.findByText('1 attempt left')).toBeInTheDocument();
  });

  it('withholds the form once the attempt limit is used up', async () => {
    render({ ...ASSIGNMENT, maxAttempts: 1 });

    expect(
      await screen.findByText('You have used your one attempt.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hand in/ })).not.toBeInTheDocument();
  });

  it('hands the work in and reports it', async () => {
    const { user } = render();

    await handIn(user);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Handed in');
    });
  });

  it('reports the server refusing work after the assignment closed', async () => {
    server.use(
      http.post(MINE_URL, () =>
        HttpResponse.json(errorResponse(409, 'This assignment is closed', 'Conflict'), {
          status: 409,
        }),
      ),
    );

    const { user } = render();

    await handIn(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This assignment is closed',
    );
  });

  it('reports the server refusing an attempt past the limit', async () => {
    server.use(
      http.post(MINE_URL, () =>
        HttpResponse.json(
          errorResponse(409, 'No attempts are left on this assignment', 'Conflict'),
          { status: 409 },
        ),
      ),
    );

    const { user } = render();

    await handIn(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No attempts are left on this assignment',
    );
  });

  it('hands nothing in when the upload to the store fails', async () => {
    let posted = 0;

    server.use(
      http.put(uploadTicket.url, () => new HttpResponse(null, { status: 500 })),
      http.post(MINE_URL, () => {
        posted += 1;
        return HttpResponse.json(mySubmissions[0], { status: 201 });
      }),
    );

    const { user } = render();

    await handIn(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'sorting.zip could not be uploaded. Nothing was handed in.',
    );
    expect(posted).toBe(0);
  });

  it('asks for a file before it asks the store for anything', async () => {
    const { user } = render();

    const form = await screen.findByRole('form', { name: /Hand in your work/ });

    await user.click(within(form).getByRole('button', { name: /Hand in/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose at least one file',
    );
  });

  it('says so when the student has handed nothing in yet', async () => {
    server.use(http.get(MINE_URL, () => HttpResponse.json([])));

    render();

    expect(
      await screen.findByText('You have not handed anything in yet.'),
    ).toBeInTheDocument();
  });

  it('reports a server failure rather than an empty panel', async () => {
    server.use(http.get(MINE_URL, () => new HttpResponse(null, { status: 500 })));

    render();

    expect(
      await screen.findByText(
        'Your submissions could not be loaded. Try again in a moment.',
      ),
    ).toBeInTheDocument();
  });
});
