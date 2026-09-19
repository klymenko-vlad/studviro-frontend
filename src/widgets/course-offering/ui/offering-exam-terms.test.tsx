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

import { OfferingExamTerms } from './offering-exam-terms';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = '66666666-6666-4666-8666-666666666666';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;
const EXAM_TERMS = `${BASE}/course-offerings/${OFFERING}/exam-terms`;

/**
 * The test provider renders in Europe/Kyiv, so a 09:00Z exam reads as 11:00 —
 * the institution's zone, not the server's.
 */
const render = () =>
  renderWithProviders(
    <OfferingExamTerms institutionId={INSTITUTION} offeringId={OFFERING} />,
  );

const withPermissions = (granted: string[]) => {
  server.use(
    http.get(`${BASE}/me/permissions`, () =>
      HttpResponse.json({ ...permissions, roles: ['registrar'], permissions: granted }),
    ),
  );
};

async function fillTerm() {
  await userEvent.type(await screen.findByLabelText('Exam day'), '2027-01-12');
}

const offerForm = () => screen.getByRole('form', { name: 'Offer an exam term' });

describe('OfferingExamTerms', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('lists a term with its room, examiner, seats and window', async () => {
    render();

    const list = await screen.findByRole('list', { name: 'Exam terms' });

    expect(within(list).getByText('Jan 12 11:00–13:00')).toBeInTheDocument();
    expect(within(list).getByText('FEI-101')).toBeInTheDocument();
    expect(within(list).getByText('Jana Nováková')).toBeInTheDocument();
    expect(within(list).getByText('12 of 30 seats taken')).toBeInTheDocument();
    expect(within(list).getByText('Registration Dec 15 to Jan 10')).toBeInTheDocument();
  });

  it('strikes a called-off term through and offers nothing but removal', async () => {
    render();

    const list = await screen.findByRole('list', { name: 'Exam terms' });
    const items = within(list).getAllByRole('listitem');
    const cancelled = items.find(item => item.textContent?.includes('Called off'))!;

    expect(cancelled.querySelector('.line-through')).not.toBeNull();
    expect(
      within(cancelled).queryByRole('button', { name: /Call off/ }),
    ).not.toBeInTheDocument();
    expect(
      within(cancelled).getByRole('button', { name: /^Remove the exam term/ }),
    ).toBeInTheDocument();
  });

  it('offers a term', async () => {
    render();
    await fillTerm();
    await userEvent.click(
      within(offerForm()).getByRole('button', { name: 'Offer term' }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('The exam term was offered.');
    });
  });

  it('refuses an exam that ends before it starts, without asking the server', async () => {
    let posted = false;
    server.use(
      http.post(EXAM_TERMS, () => {
        posted = true;
        return HttpResponse.json({ id: 'x' }, { status: 201 });
      }),
    );

    render();
    await fillTerm();
    await userEvent.clear(screen.getByLabelText('To'));
    await userEvent.type(screen.getByLabelText('To'), '08:00');
    await userEvent.click(
      within(offerForm()).getByRole('button', { name: 'Offer term' }),
    );

    expect(
      await screen.findByText('An exam must end after it starts'),
    ).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('refuses a registration window that stays open past the exam', async () => {
    render();
    await fillTerm();
    await userEvent.type(screen.getByLabelText('Registration closes'), '2027-01-20');
    await userEvent.click(
      within(offerForm()).getByRole('button', { name: 'Offer term' }),
    );

    expect(
      await screen.findByText('Registration must close before the exam starts'),
    ).toBeInTheDocument();
  });

  it('puts a refused examiner on the form rather than a toast', async () => {
    server.use(
      http.post(EXAM_TERMS, () =>
        HttpResponse.json(
          errorResponse(
            409,
            'An examiner must be somebody who teaches this course',
            'Conflict',
          ),
          { status: 409 },
        ),
      ),
    );

    render();
    await fillTerm();
    await userEvent.click(
      within(offerForm()).getByRole('button', { name: 'Offer term' }),
    );

    expect(
      await screen.findByText('An examiner must be somebody who teaches this course'),
    ).toBeInTheDocument();
  });

  it('calls a term off', async () => {
    render();

    await userEvent.click(
      await screen.findByRole('button', { name: /^Call off the exam term/ }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'The exam term on Jan 12 11:00–13:00 was called off.',
      );
    });
  });

  it('reopens the same form to change a term’s capacity', async () => {
    render();

    await userEvent.click(
      await screen.findByRole('button', { name: /^Edit the exam term/ }),
    );

    const editor = screen.getByRole('form', { name: 'Edit this exam term' });
    const capacity = within(editor).getByLabelText('Seats');
    expect(capacity).toHaveValue('30');

    await userEvent.clear(capacity);
    await userEvent.type(capacity, '40');
    await userEvent.click(within(editor).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('The exam term was saved.');
    });
  });

  it('shows the terms to a reader with nothing to press', async () => {
    withPermissions(['institution:read', 'schedule:read']);
    render();

    expect(await screen.findByText('Jan 12 11:00–13:00')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Offer term' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Call off the exam term/ }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing at all without schedule:read', async () => {
    withPermissions(['institution:read']);
    const { container } = render();

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('says so when no term has been offered', async () => {
    server.use(http.get(EXAM_TERMS, () => HttpResponse.json([])));

    render();

    expect(
      await screen.findByText('No exam term has been offered for this course yet.'),
    ).toBeInTheDocument();
  });
});
