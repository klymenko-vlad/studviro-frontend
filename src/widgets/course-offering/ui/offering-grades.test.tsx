import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  offeringResults,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
} from '@/shared/test';

import { OfferingGrades } from './offering-grades';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = '66666666-6666-4666-8666-666666666666';
const URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/course-offerings/${OFFERING}/results`;

const render = () =>
  renderWithProviders(
    <OfferingGrades institutionId={INSTITUTION} offeringId={OFFERING} />,
  );

describe('OfferingGrades', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('lists every recorded student with the attempt they are on', async () => {
    render();

    expect(await screen.findByText('Veronika Gajdošová')).toBeInTheDocument();
    expect(screen.getByText('Marek Horváth')).toBeInTheDocument();
    expect(screen.getByText('Attempt 1')).toBeInTheDocument();
    expect(screen.getByText('No sitting yet')).toBeInTheDocument();
  });

  it('says a student without a result sat the exam once attendance is recorded', async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          ...offeringResults,
          students: offeringResults.students.map(student =>
            student.attempts.length > 0
              ? student
              : {
                  ...student,
                  sitting: {
                    examTermId: '99999999-9999-4999-8999-999999999999',
                    startsAt: '2026-09-01T09:00:00.000Z',
                    status: 'attended',
                  },
                },
          ),
        }),
      ),
    );
    render();

    expect(await screen.findByText('Sat the exam on Sep 1, 2026')).toBeInTheDocument();
    expect(screen.queryByText('No sitting yet')).not.toBeInTheDocument();
  });

  it.each([
    ['registered', 'Registered for Sep 1, 2026'],
    ['no_show', 'Did not come on Sep 1, 2026'],
    ['excused', 'Excused on Sep 1, 2026'],
  ] as const)('names a %s sitting beside the attempt', async (status, text) => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          ...offeringResults,
          students: [
            {
              ...offeringResults.students[0]!,
              sitting: {
                examTermId: '99999999-9999-4999-8999-999999999999',
                startsAt: '2026-09-01T09:00:00.000Z',
                status,
              },
            },
          ],
        }),
      ),
    );
    render();

    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.getByText('Attempt 1')).toBeInTheDocument();
  });

  it('says a student with no result is not graded rather than showing nothing', async () => {
    render();

    expect(await screen.findByText('Not graded')).toBeInTheDocument();
  });

  it('proposes a grade for the student the row names', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put(`${URL}/:enrollmentId`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({
          id: 'r',
          enrollmentId: 'e',
          attempt: 1,
          status: 'proposed',
        });
      }),
    );
    render();

    await screen.findByText('Marek Horváth');
    await userEvent.selectOptions(screen.getByLabelText('Grade for Marek Horváth'), 'A');
    await userEvent.click(screen.getAllByRole('button', { name: 'Propose' })[1]!);

    await waitFor(() => {
      expect(body).toEqual({ proposedGrade: 'A' });
    });
  });

  it('publishes as a separate decision from proposing', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put(`${URL}/:enrollmentId`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;

        return HttpResponse.json({
          id: 'r',
          enrollmentId: 'e',
          attempt: 1,
          status: 'official',
        });
      }),
    );
    render();

    await screen.findByText('Marek Horváth');
    await userEvent.selectOptions(screen.getByLabelText('Grade for Marek Horváth'), 'C');
    await userEvent.click(screen.getAllByRole('button', { name: 'Publish' })[1]!);

    await waitFor(() => {
      expect(body).toEqual({ officialGrade: 'C' });
    });
  });

  it('offers no publish button to somebody who may only propose', async () => {
    server.use(
      http.get(URL, () => HttpResponse.json({ ...offeringResults, canPublish: false })),
    );
    render();

    expect(await screen.findByText(/Publishing it is someone else/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument();
  });

  it('surfaces the server’s refusal instead of claiming the grade was saved', async () => {
    server.use(
      http.put(`${URL}/:enrollmentId`, () =>
        HttpResponse.json(
          {
            statusCode: 403,
            error: 'Forbidden',
            message: 'you may only propose',
            path: '/x',
            requestId: 'r',
            timestamp: '2026-01-01T00:00:00.000Z',
          },
          { status: 403 },
        ),
      ),
    );
    render();

    await screen.findByText('Marek Horváth');
    await userEvent.selectOptions(screen.getByLabelText('Grade for Marek Horváth'), 'A');
    await userEvent.click(screen.getAllByRole('button', { name: 'Propose' })[1]!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('you may only propose');
    });
  });

  it('says so plainly when nobody is recorded in the offering', async () => {
    server.use(
      http.get(URL, () => HttpResponse.json({ ...offeringResults, students: [] })),
    );
    render();

    expect(await screen.findByText(/Nobody is recorded/)).toBeInTheDocument();
  });

  it('reports a failure to read rather than an empty table', async () => {
    server.use(http.get(URL, () => new HttpResponse(null, { status: 500 })));
    render();

    await waitFor(() => {
      expect(screen.getByText(/could not be read/)).toBeInTheDocument();
    });
  });
});
