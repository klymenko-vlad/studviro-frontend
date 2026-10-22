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
} from '@/shared/test';

import { Rooms } from './rooms';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;

const render = () => renderWithProviders(<Rooms institutionId={INSTITUTION} />);

const withoutScheduleManage = () => {
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

describe('Rooms', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('lists the rooms grouped by building, and says when there is no building', async () => {
    render();

    expect(await screen.findByText('FEI-101')).toBeInTheDocument();
    expect(screen.getByText('Blok A')).toBeInTheDocument();
    expect(screen.getByText('No building')).toBeInTheDocument();
  });

  it('shows a dash rather than a zero for an unknown capacity', async () => {
    render();

    const row = (await screen.findByText('FEI-202')).closest('tr');

    expect(row?.textContent).toContain('—');
    expect(row?.textContent).not.toContain('0 seats');
  });

  it('adds a room', async () => {
    render();

    await userEvent.type(await screen.findByLabelText('Code'), 'FEI-303');
    await userEvent.click(screen.getByRole('button', { name: 'Add room' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('FEI-101 was added.');
    });
  });

  it('refuses a capacity that is not a whole number of seats', async () => {
    let posted = false;
    server.use(
      http.post(`${BASE}/rooms`, () => {
        posted = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    render();
    await userEvent.type(await screen.findByLabelText('Code'), 'FEI-303');
    await userEvent.type(screen.getByLabelText('Seats'), '-4');
    await userEvent.click(screen.getByRole('button', { name: 'Add room' }));

    expect(await screen.findByText('Use a whole number of seats')).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('puts a duplicate code on the code field', async () => {
    server.use(
      http.post(`${BASE}/rooms`, () =>
        HttpResponse.json(
          errorResponse(409, 'Another room already has that code', 'Conflict'),
          {
            status: 409,
          },
        ),
      ),
    );

    render();
    await userEvent.type(await screen.findByLabelText('Code'), 'FEI-101');
    await userEvent.click(screen.getByRole('button', { name: 'Add room' }));

    expect(
      await screen.findByText('Another room already has that code'),
    ).toBeInTheDocument();
  });

  it('explains why a booked room cannot be retired', async () => {
    server.use(
      http.delete(`${BASE}/rooms/:id`, () =>
        HttpResponse.json(
          errorResponse(
            409,
            'Classes or exams are still booked into this room',
            'Conflict',
          ),
          { status: 409 },
        ),
      ),
    );

    render();
    await userEvent.click(await screen.findByRole('button', { name: 'Retire FEI-101' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Classes or exams are still booked into this room',
      );
    });
  });

  it('shows the rooms but no controls without schedule:manage', async () => {
    withoutScheduleManage();
    render();

    expect(await screen.findByText('FEI-101')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add room' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retire/ })).not.toBeInTheDocument();
  });
});
