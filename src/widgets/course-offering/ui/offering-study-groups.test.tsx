import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  courseRoster,
  errorResponse,
  permissions,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingStudyGroups } from './offering-study-groups';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = '66666666-6666-4666-8666-666666666666';
const BASE = `/api/proxy/api/v1/institutions/${INSTITUTION}`;
const GROUPS = `${BASE}/course-offerings/${OFFERING}/study-groups`;

const render = () =>
  renderWithProviders(
    <OfferingStudyGroups institutionId={INSTITUTION} offeringId={OFFERING} />,
  );

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

describe('OfferingStudyGroups', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('lists each group with its places and its members', async () => {
    render();

    const list = await screen.findByRole('list', { name: 'Groups' });

    expect(within(list).getByText('Monday seminar')).toBeInTheDocument();
    expect(within(list).getByText('1 of 20')).toBeInTheDocument();
    expect(within(list).getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('says a group with no places left is full rather than offering a picker', async () => {
    render();

    const list = await screen.findByRole('list', { name: 'Groups' });
    const lab = within(list)
      .getAllByRole('listitem')
      .find(item => item.textContent?.includes('L1'));

    expect(within(lab!).getByText('This group is full.')).toBeInTheDocument();
    expect(within(lab!).queryByLabelText('Add somebody to group L1')).toBeNull();
  });

  it('opens a group', async () => {
    render();

    await userEvent.type(await screen.findByLabelText('Code'), 'S2');
    await userEvent.click(screen.getByRole('button', { name: 'Open group' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('The group was opened.');
    });
  });

  it('puts a duplicate code on the code field', async () => {
    server.use(
      http.post(GROUPS, () =>
        HttpResponse.json(
          errorResponse(
            409,
            'Another group on this offering already has that code',
            'Conflict',
          ),
          { status: 409 },
        ),
      ),
    );

    render();
    await userEvent.type(await screen.findByLabelText('Code'), 'S1');
    await userEvent.click(screen.getByRole('button', { name: 'Open group' }));

    expect(
      await screen.findByText('Another group on this offering already has that code'),
    ).toBeInTheDocument();
  });

  it('takes a member out of a group', async () => {
    render();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Remove Ada Lovelace from this group' }),
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Ada Lovelace left the group.');
    });
  });

  it('surfaces the server’s refusal when a student is not on the roster', async () => {
    server.use(
      http.post(`${GROUPS}/:groupId/members`, () =>
        HttpResponse.json(
          errorResponse(409, 'That student is not enrolled on this offering', 'Conflict'),
          { status: 409 },
        ),
      ),
    );

    render();
    await userEvent.selectOptions(
      await screen.findByLabelText('Add somebody to group S1'),
      '11111111-1111-4111-8111-111111111112',
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'That student is not enrolled on this offering',
      );
    });
  });

  it('shows the groups to a student with nothing to press', async () => {
    readOnly();
    render();

    expect(await screen.findByText('Monday seminar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open group' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Close/ })).not.toBeInTheDocument();
  });

  it('tells the difference between an empty roster and a fully assigned one', async () => {
    server.use(
      http.get(`${BASE}/course-offerings/${OFFERING}/roster`, () =>
        HttpResponse.json({ ...courseRoster, students: [] }),
      ),
    );

    render();

    expect(
      await screen.findByText(
        'Nobody is enrolled on this offering yet, so there is nobody to put in a group.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Everybody on the roster is already in this group.'),
    ).not.toBeInTheDocument();
  });

  it('says so when the offering has no groups', async () => {
    server.use(http.get(GROUPS, () => HttpResponse.json([])));

    render();

    expect(
      await screen.findByText('No groups on this offering yet.'),
    ).toBeInTheDocument();
  });
});
