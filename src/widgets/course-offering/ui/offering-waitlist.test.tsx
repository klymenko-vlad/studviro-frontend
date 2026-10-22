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

import { OfferingWaitlist } from './offering-waitlist';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = '66666666-6666-4666-8666-666666666666';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;
const OFFERING_BASE = `${BASE}/course-offerings/${OFFERING}`;

const render = () =>
  renderWithProviders(
    <OfferingWaitlist institutionId={INSTITUTION} offeringId={OFFERING} />,
  );

const withPermissions = (granted: string[]) => {
  server.use(
    http.get(`${BASE}/me/permissions`, () =>
      HttpResponse.json({ ...permissions, roles: ['registrar'], permissions: granted }),
    ),
  );
};

describe('OfferingWaitlist', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    withPermissions(['institution:read', 'enrollment:read', 'enrollment:manage']);
  });

  it('lists who is waiting, in the order they joined', async () => {
    render();

    const list = await screen.findByRole('list', { name: 'Waiting list' });
    const names = within(list)
      .getAllByRole('listitem')
      .map(item => item.textContent);

    expect(names[0]).toContain('Ada Lovelace');
    expect(names[1]).toContain('Alan Turing');
    expect(within(list).getByText('Waiting since Jan 15')).toBeInTheDocument();
  });

  it('admits a student and says so', async () => {
    let decided: unknown;
    server.use(
      http.patch(`${OFFERING_BASE}/enrollments/:enrollmentId`, async ({ request }) => {
        decided = await request.json();
        return HttpResponse.json({
          id: 'd1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d1',
          status: 'active',
        });
      }),
    );
    render();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Admit Ada Lovelace' }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Ada Lovelace was given a place.');
    });
    expect(decided).toEqual({ status: 'active' });
  });

  it('refuses a student and says so', async () => {
    render();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Refuse Alan Turing' }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Alan Turing was refused a place.');
    });
  });

  it('puts a refusal from the server in a toast', async () => {
    server.use(
      http.patch(`${OFFERING_BASE}/enrollments/:enrollmentId`, () =>
        HttpResponse.json(errorResponse(404, 'enrollment not found', 'Not Found'), {
          status: 404,
        }),
      ),
    );
    render();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Admit Ada Lovelace' }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('enrollment not found');
    });
  });

  it('says so when nobody is waiting', async () => {
    server.use(http.get(`${OFFERING_BASE}/waitlist`, () => HttpResponse.json([])));
    render();

    expect(await screen.findByText('Nobody is waiting for a place.')).toBeInTheDocument();
  });

  it('renders nothing for somebody who cannot manage enrolment', async () => {
    withPermissions(['institution:read', 'enrollment:read']);
    const { container } = render();

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});
