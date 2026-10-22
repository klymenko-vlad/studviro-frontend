import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  courseOffering,
  errorResponse,
  permissions,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingStaff } from './offering-staff';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = '66666666-6666-4666-8666-666666666666';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;
const TEACHING = `${BASE}/course-offerings/${OFFERING}/teaching`;

const render = () =>
  renderWithProviders(
    <OfferingStaff
      offering={courseOffering}
      institutionId={INSTITUTION}
      offeringId={OFFERING}
    />,
  );

/** The picker fills from its own query, so the options arrive a tick later. */
async function choosePerson() {
  const picker = await screen.findByLabelText('Person');

  await userEvent.click(picker);
  await userEvent.click(await screen.findByRole('option', { name: /Jana Nováková/u }));
}

const readOnly = () => {
  server.use(
    http.get(`${BASE}/me/permissions`, () =>
      HttpResponse.json({
        ...permissions,
        roles: ['student'],
        permissions: ['institution:read', 'offering:read'],
      }),
    ),
  );
};

describe('OfferingStaff', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('lists who teaches, with the lead marked, and offers no controls to a student', async () => {
    readOnly();
    render();

    const list = await screen.findByRole('list', { name: 'Teaching staff' });

    expect(within(list).getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Assign' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
  });

  it('lets somebody with offering:manage assign a teacher', async () => {
    render();

    await choosePerson();
    await userEvent.click(screen.getByRole('button', { name: 'Assign' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('They now teach this offering.');
    });
  });

  it('removes somebody from the offering', async () => {
    render();

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Remove Jana Nováková from this offering',
      }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Jana Nováková no longer teaches this offering.',
      );
    });
  });

  it('puts a refused assignment on the person field, not in a toast', async () => {
    server.use(
      http.post(TEACHING, () =>
        HttpResponse.json(
          errorResponse(
            409,
            'That person is not part of this institution; invite them first',
            'Conflict',
          ),
          { status: 409 },
        ),
      ),
    );

    render();
    await choosePerson();
    await userEvent.click(screen.getByRole('button', { name: 'Assign' }));

    expect(
      await screen.findByText(
        'That person is not part of this institution; invite them first',
      ),
    ).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('says so when nobody teaches the offering yet', async () => {
    server.use(http.get(TEACHING, () => HttpResponse.json([])));

    render();

    expect(await screen.findByText('No teaching staff recorded.')).toBeInTheDocument();
  });
});
