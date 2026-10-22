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

import { OfferingTimetable } from './offering-timetable';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = '66666666-6666-4666-8666-666666666666';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;
const TIMETABLE = `${BASE}/course-offerings/${OFFERING}/timetable`;

/**
 * The test provider renders in Europe/Kyiv, and the panel formats in the
 * institution's zone rather than UTC — so a 09:00Z class reads as 12:00, which
 * is the whole point of the change these expectations encode.
 */
const render = () =>
  renderWithProviders(
    <OfferingTimetable institutionId={INSTITUTION} offeringId={OFFERING} />,
  );

const readOnly = () => {
  server.use(
    http.get(`${BASE}/me/permissions`, () =>
      HttpResponse.json({
        ...permissions,
        roles: ['student'],
        permissions: ['institution:read', 'schedule:read'],
      }),
    ),
  );
};

async function fillSlot() {
  await userEvent.type(await screen.findByLabelText('First class'), '2026-09-21');
}

describe('OfferingTimetable', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('groups a weekly slot back into one row rather than listing every week', async () => {
    render();

    const list = await screen.findByRole('list', { name: 'Timetable' });
    const slots = within(list).getAllByRole('listitem', { name: undefined });

    expect(within(list).getByText(/Monday 12:00–14:00/)).toBeInTheDocument();
    expect(within(list).getByText('2 weeks')).toBeInTheDocument();
    expect(within(list).getByText('1 week')).toBeInTheDocument();
    expect(slots.length).toBeGreaterThan(0);
  });

  it('keeps a slot in a different room or at a different time apart', async () => {
    render();

    const list = await screen.findByRole('list', { name: 'Timetable' });

    expect(within(list).getByText(/Wednesday 16:00–18:00/)).toBeInTheDocument();
    expect(within(list).getByText('S1')).toBeInTheDocument();
    expect(within(list).getByText('No room')).toBeInTheDocument();
  });

  it('strikes through a class that was called off rather than hiding it', async () => {
    render();

    const cancelled = (await screen.findAllByTestId('timetable-occurrence')).find(item =>
      item.textContent?.includes('Sep 28'),
    );

    expect(cancelled?.querySelector('.line-through')).not.toBeNull();
    expect(
      within(cancelled!).getByRole('button', { name: /Put the class/ }),
    ).toBeInTheDocument();
  });

  it('schedules a term of classes and says how many', async () => {
    render();
    await fillSlot();
    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('7 classes scheduled.');
    });
  });

  it('refuses a slot that ends before it starts, without asking the server', async () => {
    let posted = false;
    server.use(
      http.post(TIMETABLE, () => {
        posted = true;
        return HttpResponse.json({ created: 1 }, { status: 201 });
      }),
    );

    render();
    await fillSlot();
    await userEvent.clear(screen.getByLabelText('To'));
    await userEvent.type(screen.getByLabelText('To'), '08:00');
    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));

    expect(
      await screen.findByText('A class must end after it starts'),
    ).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('puts a double-booked room on the time field', async () => {
    server.use(
      http.post(TIMETABLE, () =>
        HttpResponse.json(
          errorResponse(
            409,
            'That room is already booked for part of this slot',
            'Conflict',
          ),
          { status: 409 },
        ),
      ),
    );

    render();
    await fillSlot();
    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));

    expect(
      await screen.findByText('That room is already booked for part of this slot'),
    ).toBeInTheDocument();
  });

  it('calls a single class off', async () => {
    render();

    const first = (await screen.findAllByTestId('timetable-occurrence'))[0]!;
    await userEvent.click(within(first).getByRole('button', { name: /Call off/ }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('The class on Sep 21 was called off.');
    });
  });

  it('shows the timetable to a student with nothing to press', async () => {
    readOnly();
    render();

    expect(await screen.findByText(/Monday 12:00–14:00/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Schedule' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Call off/ })).not.toBeInTheDocument();
  });

  it('says so when nothing is scheduled', async () => {
    server.use(http.get(TIMETABLE, () => HttpResponse.json([])));

    render();

    expect(
      await screen.findByText('Nothing is scheduled for this course yet.'),
    ).toBeInTheDocument();
  });
});
