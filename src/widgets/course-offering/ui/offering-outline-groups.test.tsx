import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  itemSight,
  learningMaterials,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingOutline } from './offering-outline';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const SPACE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}`;
const NOTES_ID = 'ba5e0001-0001-4001-8001-000000000003';
const S1 = 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1';

const forGroups = (locked: boolean, hideFromOthers: boolean) => ({
  match: 'all',
  hideWhenLocked: false,
  locked,
  conditions: [],
  audience: {
    hideFromOthers,
    groups: [{ groupId: S1, groupName: 'Monday seminar', missing: false }],
  },
});

const render = (viewerRole: 'student' | 'administrator') =>
  renderWithProviders(
    <OfferingOutline
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      spaceId={SPACE}
      viewerRole={viewerRole}
    />,
  );

function serveNotes(restriction: object) {
  server.use(
    http.get(`${SPACE_URL}/materials`, () =>
      HttpResponse.json(
        learningMaterials.map(material =>
          material.id === NOTES_ID ? { ...material, restriction } : material,
        ),
      ),
    ),
  );
}

function capturePatches() {
  const bodies: unknown[] = [];
  server.use(
    http.patch(`${SPACE_URL}/materials/:materialId`, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(learningMaterials[2]);
    }),
  );

  return bodies;
}

describe('OfferingOutline content for groups', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('badges an item for its groups, for an author', async () => {
    serveNotes(forGroups(false, true));
    render('administrator');

    expect(await screen.findByText('Group Monday seminar')).toBeInTheDocument();
    expect(screen.getByText('Hidden from other groups')).toBeInTheDocument();
  });

  it('tells a student in another group who the item is for', async () => {
    serveNotes(forGroups(true, false));
    render('student');

    const general = await screen.findByRole('region', { name: 'General' });

    expect(
      within(general).getByText('Only for group Monday seminar'),
    ).toBeInTheDocument();
  });

  it('restricts an item to groups an author picks, shown locked to the rest', async () => {
    const bodies = capturePatches();
    const user = userEvent.setup();
    render('administrator');

    await user.click(
      await screen.findByRole('button', { name: 'Groups for How marking works' }),
    );
    const form = screen.getByRole('form', { name: 'Groups for How marking works' });

    await user.click(await within(form).findByRole('switch', { name: 'Monday seminar' }));
    await user.selectOptions(
      within(form).getByLabelText('Students in other groups'),
      'locked',
    );
    await user.click(within(form).getByRole('button', { name: 'Save groups' }));

    await waitFor(() => {
      expect(bodies).toEqual([{ audience: { groupIds: [S1], hideFromOthers: false } }]);
    });
    expect(toast.success).toHaveBeenCalledWith('Groups saved');
  });

  it('will not save without a group, and makes an item for everyone again', async () => {
    serveNotes(forGroups(false, true));
    const bodies = capturePatches();
    const user = userEvent.setup();
    render('administrator');

    await user.click(
      await screen.findByRole('button', { name: 'Groups for How marking works' }),
    );
    const form = screen.getByRole('form', { name: 'Groups for How marking works' });
    expect(within(form).getByRole('switch', { name: 'Monday seminar' })).toBeChecked();
    expect(within(form).getByRole('switch', { name: 'L1' })).not.toBeChecked();

    await user.click(within(form).getByRole('switch', { name: 'Monday seminar' }));
    await user.click(within(form).getByRole('button', { name: 'Save groups' }));
    expect(within(form).getByRole('alert')).toHaveTextContent(
      'Choose at least one group.',
    );

    await user.click(within(form).getByRole('button', { name: 'Make it for everyone' }));
    await waitFor(() => {
      expect(bodies).toEqual([{ audience: null }]);
    });
  });

  it('shows an author which students can open an item, and why not the others', async () => {
    const user = userEvent.setup();
    render('administrator');

    await user.click(
      await screen.findByRole('button', { name: 'Who can see How marking works' }),
    );
    const panel = await screen.findByRole('region', {
      name: 'Who can see How marking works',
    });

    expect(
      await within(panel).findByText('1 of 2 students can open it now'),
    ).toBeInTheDocument();
    const rows = within(panel).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Ada Lovelace');
    expect(rows[1]).toHaveTextContent('Can open');
    expect(rows[2]).toHaveTextContent('Bob Builder');
    expect(rows[2]).toHaveTextContent('Sees nothing');
    expect(rows[2]).toHaveTextContent('Only for group Monday seminar');
  });

  it('explains a schedule, a hidden item and a closed section in plain words', async () => {
    server.use(
      http.get(`${SPACE_URL}/sight/:kind/:itemId`, () =>
        HttpResponse.json({
          ...itemSight,
          items: [
            {
              ...itemSight.items[0]!,
              sight: 'title',
              reason: 'scheduled',
              source: 'item',
              availableFrom: '2026-11-03T08:00:00.000Z',
            },
            { ...itemSight.items[1]!, reason: 'hidden', restriction: null },
            {
              ...itemSight.items[1]!,
              userId: '33333333-3333-4333-8333-333333333333',
              displayName: 'Cleo Closed',
              source: 'section',
            },
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    render('administrator');

    await user.click(
      await screen.findByRole('button', { name: 'Who can see How marking works' }),
    );
    const panel = await screen.findByRole('region', {
      name: 'Who can see How marking works',
    });
    const rows = await within(panel).findAllByRole('row');

    expect(rows[1]).toHaveTextContent('Opens on November 3 at 10:00');
    expect(rows[2]).toHaveTextContent('Hidden from students');
    expect(rows[3]).toHaveTextContent('Because of its section');
  });

  it('scrolls to the item a link points at once the outline has loaded', async () => {
    const scrolled = vi.fn();
    Element.prototype.scrollIntoView = scrolled;
    window.location.hash = `#outline-material-${NOTES_ID}`;
    render('administrator');

    await waitFor(() => {
      expect(scrolled).toHaveBeenCalled();
    });
    expect(scrolled.mock.contexts[0]).toHaveAttribute(
      'id',
      `outline-material-${NOTES_ID}`,
    );
    window.location.hash = '';
  });
});
