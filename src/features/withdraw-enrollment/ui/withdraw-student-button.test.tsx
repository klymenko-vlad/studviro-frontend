import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
} from '@/shared/test';

import { WithdrawStudentButton } from './withdraw-student-button';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const ENROLLMENT = '99999999-9999-4999-8999-999999999991';
const URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/course-offerings/${OFFERING}/enrollments/${ENROLLMENT}`;

const render = () =>
  renderWithProviders(
    <WithdrawStudentButton
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      enrollmentId={ENROLLMENT}
      studentName="Ada Lovelace"
    />,
  );

describe('WithdrawStudentButton', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('asks before withdrawing and says a recorded grade stays', async () => {
    render();

    await userEvent.click(screen.getByRole('button', { name: 'Withdraw Ada Lovelace' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'Withdraw Ada Lovelace from this course?',
    });
    expect(dialog).toHaveTextContent(/official grade already recorded stays/i);
  });

  it('withdraws the student once confirmed and says so', async () => {
    let sent: unknown;
    server.use(
      http.patch(URL, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ id: ENROLLMENT, status: 'withdrawn' });
      }),
    );
    render();

    await userEvent.click(screen.getByRole('button', { name: 'Withdraw Ada Lovelace' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Withdraw' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Ada Lovelace was withdrawn.');
    });
    expect(sent).toEqual({ status: 'withdrawn' });
  });

  it('changes nothing when the registrar thinks better of it', async () => {
    const patched = vi.fn();
    server.use(
      http.patch(URL, () => {
        patched();
        return HttpResponse.json({ id: ENROLLMENT, status: 'withdrawn' });
      }),
    );
    render();

    await userEvent.click(screen.getByRole('button', { name: 'Withdraw Ada Lovelace' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(patched).not.toHaveBeenCalled();
  });

  it('reports a refusal from the server', async () => {
    server.use(
      http.patch(URL, () =>
        HttpResponse.json(errorResponse(403, 'Not allowed'), { status: 403 }),
      ),
    );
    render();

    await userEvent.click(screen.getByRole('button', { name: 'Withdraw Ada Lovelace' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Withdraw' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
