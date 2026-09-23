import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  enrollableOfferings,
  errorResponse,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
} from '@/shared/test';

import { EnrollableCourses } from './enrollable-courses';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/enrollments`;

const render = () =>
  renderWithProviders(<EnrollableCourses institutionId={INSTITUTION} />);

describe('EnrollableCourses', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('lists the courses on offer with the places left on each', async () => {
    render();

    expect(await screen.findByText('Algorithms')).toBeInTheDocument();
    expect(screen.getByText('18 of 30 places left')).toBeInTheDocument();
    expect(screen.getByText('No places left')).toBeInTheDocument();
  });

  it('says why a full course is out of reach rather than leaving it to be inferred', async () => {
    render();

    await screen.findByText('Databases');

    expect(screen.getByTestId('enrollment-blocked-note')).toHaveTextContent(
      'Every place is taken.',
    );
  });

  it('asks for a place and says the university has not answered yet', async () => {
    render();

    await userEvent.click(await screen.findByRole('button', { name: 'Enrol' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Asked for. The university has not answered yet.',
      );
    });
  });

  it('says the place is granted where the university needs no telling', async () => {
    server.use(
      http.post(BASE, () =>
        HttpResponse.json(
          {
            id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
            courseOfferingId: '66666666-6666-4666-8666-666666666666',
            status: 'active',
            enrolledAt: '2026-01-20T09:00:00.000Z',
            withdrawnAt: null,
            synchronizationStatus: 'in_sync',
          },
          { status: 201 },
        ),
      ),
    );
    render();

    await userEvent.click(await screen.findByRole('button', { name: 'Enrol' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('You have a place on this course.');
    });
  });

  it('offers withdrawal where the caller holds a place', async () => {
    server.use(
      http.get(`${BASE}/enrollable`, () =>
        HttpResponse.json([
          {
            ...enrollableOfferings[0],
            availability: {
              canEnroll: false,
              canWithdraw: true,
              canJoinWaitlist: false,
              reason: 'enrolled',
            },
            myEnrollment: {
              id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
              status: 'active',
            },
          },
        ]),
      ),
    );
    render();

    await userEvent.click(await screen.findByRole('button', { name: 'Withdraw' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('You withdrew from this course.');
    });
  });

  it('surfaces the server’s refusal instead of claiming success', async () => {
    server.use(
      http.post(BASE, () =>
        HttpResponse.json(
          errorResponse(409, 'That course has no places left', 'Conflict'),
          {
            status: 409,
          },
        ),
      ),
    );
    render();

    await userEvent.click(await screen.findByRole('button', { name: 'Enrol' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('That course has no places left');
    });
  });

  it('offers the waiting list on a full course, and says the student is on it', async () => {
    render();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Join the waiting list' }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'You are on the waiting list. You will hear when the registrar decides, and you may take a place yourself if one comes free.',
      );
    });
  });

  it('lets a waiting student leave the list, or take a place that came free', async () => {
    server.use(
      http.get(`${BASE}/enrollable`, () =>
        HttpResponse.json([
          {
            ...enrollableOfferings[1],
            availability: {
              canEnroll: true,
              canWithdraw: true,
              canJoinWaitlist: false,
              reason: 'waitlisted',
            },
            myEnrollment: {
              id: 'bbbbbbb3-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
              status: 'waitlisted',
            },
          },
        ]),
      ),
    );
    render();

    expect(
      await screen.findByRole('button', { name: 'Take the place' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('enrollment-blocked-note')).toHaveTextContent(
      'You are on the waiting list for this course.',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Leave the waiting list' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('You left the waiting list.');
    });
  });

  it('narrows the list to what the caller can act on', async () => {
    server.use(
      http.get(`${BASE}/enrollable`, () =>
        HttpResponse.json([
          enrollableOfferings[0],
          {
            ...enrollableOfferings[1],
            availability: {
              canEnroll: false,
              canWithdraw: false,
              canJoinWaitlist: false,
              reason: 'closed',
            },
          },
        ]),
      ),
    );
    render();

    await screen.findByText('Databases');
    await userEvent.click(screen.getByRole('switch'));

    expect(screen.queryByText('Databases')).not.toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
  });

  it('says so plainly when nothing is on offer', async () => {
    server.use(http.get(`${BASE}/enrollable`, () => HttpResponse.json([])));
    render();

    expect(await screen.findByText(/No courses are on offer/)).toBeInTheDocument();
  });

  it('reports a failure to read rather than an empty list', async () => {
    server.use(
      http.get(`${BASE}/enrollable`, () => new HttpResponse(null, { status: 500 })),
    );
    render();

    expect(await screen.findByText('Courses could not be loaded')).toBeInTheDocument();
  });
});
