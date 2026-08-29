import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExamTerm } from '@/entities/exam-term';
import {
  examTerms,
  permissions,
  renderWithProviders,
  screen,
  server,
  waitFor,
} from '@/shared/test';

import { ExamRegistrationButton } from './exam-registration-button';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const REGISTRATIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/exam-registrations`;

const openTerm = examTerms[0]!;
const registeredTerm = examTerms[1]!;
const teachingTerm = examTerms[2]!;

const allowRegistration = (allowed = true) => {
  server.use(
    http.get(`/api/proxy/api/v1/institutions/:institutionId/me/permissions`, () =>
      HttpResponse.json({
        ...permissions,
        permissions: allowed
          ? [...permissions.permissions, 'exam:register']
          : permissions.permissions,
      }),
    ),
  );
};

const renderButton = (term: ExamTerm) =>
  renderWithProviders(<ExamRegistrationButton institutionId={INSTITUTION} term={term} />);

describe('ExamRegistrationButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers the caller for an open exam term', async () => {
    allowRegistration();
    let body: unknown;
    server.use(
      http.post(REGISTRATIONS_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(
          {
            id: 'ddddddd5-dddd-4ddd-8ddd-ddddddddddd5',
            examTermId: openTerm.id,
            status: 'registered',
            registeredAt: new Date().toISOString(),
            cancelledAt: null,
          },
          { status: 201 },
        );
      }),
    );

    const { user } = renderButton(openTerm);
    await user.click(await screen.findByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'You are registered for this exam term.',
      );
    });
    expect(body).toEqual({ examTermId: openTerm.id });
  });

  it('cancels a registration the caller already holds', async () => {
    allowRegistration();
    let cancelled: string | undefined;
    server.use(
      http.delete(`${REGISTRATIONS_URL}/:id`, ({ params }) => {
        cancelled = String(params['id']);

        return HttpResponse.json({
          id: cancelled,
          examTermId: registeredTerm.id,
          status: 'cancelled',
          registeredAt: null,
          cancelledAt: new Date().toISOString(),
        });
      }),
    );

    const { user } = renderButton({ ...registeredTerm, registrationState: 'open' });
    await user.click(await screen.findByRole('button', { name: 'Cancel registration' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Your registration has been cancelled.');
    });
    expect(cancelled).toBe(registeredTerm.myRegistration?.id);
  });

  it('reports what the server refused', async () => {
    allowRegistration();
    server.use(
      http.post(REGISTRATIONS_URL, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            code: 'EXAM_TERM_FULL',
            message: 'That exam term has no seats left',
          },
          { status: 409 },
        ),
      ),
    );

    const { user } = renderButton(openTerm);
    await user.click(await screen.findByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('That exam term has no seats left');
    });
  });

  it('offers nothing to a caller without the permission', async () => {
    allowRegistration(false);
    renderButton(openTerm);

    await waitFor(() => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  it('offers nothing on an exam the caller examines', () => {
    allowRegistration();
    renderButton(teachingTerm);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('refuses to register while the window is shut', async () => {
    allowRegistration();
    renderButton({ ...openTerm, registrationState: 'not_open' });

    expect(await screen.findByRole('button', { name: 'Register' })).toBeDisabled();
  });

  it('says when a term has no seats left', async () => {
    allowRegistration();
    renderButton({ ...openTerm, isFull: true, seatsRemaining: 0 });

    expect(await screen.findByRole('button', { name: 'No seats left' })).toBeDisabled();
  });
});
