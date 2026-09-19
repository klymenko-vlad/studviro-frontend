import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  offeringAssignments,
  permissions,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingAssignments } from './offering-assignments';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;
const ASSIGNMENTS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}/assignments`;

const render = (viewerRole: 'student' | 'teacher' | 'administrator' = 'administrator') =>
  renderWithProviders(
    <OfferingAssignments
      institutionId={INSTITUTION}
      spaceId={SPACE}
      viewerRole={viewerRole}
    />,
  );

const grant = (granted: string[]) => {
  server.use(
    http.get(PERMISSIONS_URL, () =>
      HttpResponse.json({ ...permissions, permissions: granted }),
    ),
  );
};

describe('OfferingAssignments', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('names the assignment, its window and its attempt policy', async () => {
    render();

    expect(await screen.findByText('Assignment 1 — sorting')).toBeInTheDocument();
    expect(screen.getByText(/Opens Sep 21, 10:00/)).toBeInTheDocument();
    expect(screen.getByText('2 attempts')).toBeInTheDocument();
    expect(screen.getByText('Late work accepted')).toBeInTheDocument();
  });

  it('renders a deadline in the institution zone, not in UTC', async () => {
    render();

    // Europe/Kyiv, which the test providers set: 21:00Z on 1 October is
    // midnight on 2 October there.
    expect(await screen.findByText(/due Oct 2, 00:00/)).toBeInTheDocument();
  });

  it('adds an assignment', async () => {
    const { user } = render();

    const form = await screen.findByRole('form', { name: 'Add an assignment' });

    await user.type(within(form).getByRole('textbox', { name: 'Name' }), 'Assignment 2');
    await user.click(within(form).getByRole('button', { name: 'Add the assignment' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Assignment added');
    });
  });

  it('refuses a window that closes before it falls due, without asking the server', async () => {
    let posted = 0;

    server.use(
      http.post(ASSIGNMENTS_URL, () => {
        posted += 1;
        return HttpResponse.json(offeringAssignments[0], { status: 201 });
      }),
    );

    const { user } = render();

    const form = await screen.findByRole('form', { name: 'Add an assignment' });

    await user.type(within(form).getByRole('textbox', { name: 'Name' }), 'Assignment 2');
    await user.type(within(form).getByLabelText('Due'), '2026-10-01T21:00');
    await user.type(within(form).getByLabelText('Closes'), '2026-09-01T21:00');
    await user.click(within(form).getByRole('button', { name: 'Add the assignment' }));

    expect(
      await screen.findByText('An assignment closes after it falls due'),
    ).toBeInTheDocument();
    expect(posted).toBe(0);
  });

  it('keeps authoring away from a student, and shows them their own submission instead', async () => {
    grant(['offering:read']);

    render('student');

    expect(await screen.findByText('Assignment 1 — sorting')).toBeInTheDocument();
    expect(
      screen.queryByRole('form', { name: 'Add an assignment' }),
    ).not.toBeInTheDocument();
    expect(await screen.findByText('Your submission')).toBeInTheDocument();
  });

  it('never shows a student anybody else’s submission', async () => {
    grant(['offering:read']);

    render('student');

    expect(await screen.findByText('Your submission')).toBeInTheDocument();
    expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: 'Submissions for Assignment 1 — sorting' }),
    ).not.toBeInTheDocument();
  });

  it('shows the marking table to staff who may propose a grade', async () => {
    render('teacher');

    expect(
      await screen.findByRole('table', {
        name: 'Submissions for Assignment 1 — sorting',
      }),
    ).toBeInTheDocument();
  });

  it('withholds the marking table from staff who may not propose a grade', async () => {
    grant(['offering:read', 'offering:manage']);

    render('teacher');

    expect(await screen.findByText('Assignment 1 — sorting')).toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: 'Submissions for Assignment 1 — sorting' }),
    ).not.toBeInTheDocument();
  });

  it('reports a server failure rather than an empty list', async () => {
    server.use(http.get(ASSIGNMENTS_URL, () => new HttpResponse(null, { status: 500 })));

    render();

    expect(
      await screen.findByText('Assignments could not be loaded. Try again in a moment.'),
    ).toBeInTheDocument();
  });
});
