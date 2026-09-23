import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OfferingExamTerm } from '@/entities/offering-exam-term';
import {
  errorResponse,
  examRegistrants,
  offeringExamTerms,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingExamRegistrants } from './offering-exam-registrants';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = '66666666-6666-4666-8666-666666666666';
const REGISTRANTS = `/api/proxy/api/v1/institutions/${INSTITUTION}/course-offerings/${OFFERING}/exam-terms/:examTermId/registrations`;

const sat: OfferingExamTerm = {
  ...offeringExamTerms[0]!,
  startsAt: '2020-01-12T09:00:00.000Z',
};
const upcoming: OfferingExamTerm = {
  ...offeringExamTerms[0]!,
  startsAt: '2099-01-12T09:00:00.000Z',
};

const render = (term: OfferingExamTerm) =>
  renderWithProviders(
    <OfferingExamRegistrants
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      term={term}
      label="Jan 12"
    />,
  );

const open = async () => {
  await userEvent.click(
    screen.getByRole('button', { name: 'Show who registered for the exam on Jan 12' }),
  );

  return screen.findByRole('list', { name: 'Registered for the exam on Jan 12' });
};

describe('OfferingExamRegistrants', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('stays closed until asked, and then lists who registered', async () => {
    render(sat);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    const list = await open();

    expect(within(list).getByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(list).getByText('Alan Turing')).toBeInTheDocument();
  });

  it('records a student who did not come', async () => {
    let recorded: unknown;
    server.use(
      http.put(`${REGISTRANTS}/:registrationId/attendance`, async ({ request }) => {
        recorded = await request.json();
        return HttpResponse.json({ ...examRegistrants[0]!, status: 'no_show' });
      }),
    );

    render(sat);
    await open();

    await userEvent.selectOptions(
      screen.getByLabelText('Attendance of Ada Lovelace'),
      'Did not come',
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Ada Lovelace: did not come.');
    });
    expect(recorded).toEqual({ status: 'no_show' });
  });

  it('shows an absence already on the record and lets it be excused', async () => {
    render(sat);
    await open();

    const alan = screen.getByLabelText('Attendance of Alan Turing');
    expect(alan).toHaveValue('no_show');

    await userEvent.selectOptions(alan, 'Excused');

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Alan Turing: excused.');
    });
  });

  it('puts a refusal in a toast and leaves the record as it was', async () => {
    server.use(
      http.put(`${REGISTRANTS}/:registrationId/attendance`, () =>
        HttpResponse.json(
          errorResponse(
            409,
            'Attendance can be recorded once the exam has started',
            'Conflict',
          ),
          { status: 409 },
        ),
      ),
    );

    render(sat);
    await open();

    const ada = screen.getByLabelText('Attendance of Ada Lovelace');
    await userEvent.selectOptions(ada, 'Sat the exam');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Attendance can be recorded once the exam has started',
      );
    });
    expect(ada).toHaveValue('');
  });

  it('shows statuses without a control before the exam, and says why', async () => {
    render(upcoming);
    const list = await open();

    expect(screen.queryByLabelText('Attendance of Ada Lovelace')).not.toBeInTheDocument();
    expect(within(list).getByText('Did not come')).toBeInTheDocument();
    expect(
      screen.getByText('Attendance can be recorded once the exam has started.'),
    ).toBeInTheDocument();
  });

  it('says so when nobody registered', async () => {
    server.use(http.get(REGISTRANTS, () => HttpResponse.json([])));

    render(sat);
    await userEvent.click(
      screen.getByRole('button', { name: 'Show who registered for the exam on Jan 12' }),
    );

    expect(
      await screen.findByText('Nobody holds a seat on this term.'),
    ).toBeInTheDocument();
  });
});
