import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ASSIGNMENT_ID,
  learningMaterials,
  learningSections,
  offeringAssignments,
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
const GROUP_ID = 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1';

const condition = (overrides: object) => ({
  type: 'completed',
  itemKind: null,
  itemId: null,
  itemTitle: null,
  atLeast: null,
  from: null,
  groupId: null,
  groupName: null,
  missing: false,
  match: null,
  conditions: null,
  ...overrides,
});

const afterAssignment = (locked: boolean) => ({
  match: 'all',
  hideWhenLocked: false,
  locked,
  audience: null,
  conditions: [
    condition({
      type: 'completed',
      itemKind: 'assignment',
      itemId: ASSIGNMENT_ID,
      itemTitle: 'Assignment 1 — sorting',
    }),
  ],
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

function serve(locked: boolean) {
  server.use(
    http.get(`${SPACE_URL}/materials`, () =>
      HttpResponse.json(
        learningMaterials.map(material =>
          material.id === NOTES_ID
            ? { ...material, body: null, restriction: afterAssignment(locked) }
            : material,
        ),
      ),
    ),
    http.get(`${SPACE_URL}/sections`, () =>
      HttpResponse.json(
        learningSections.map(section => ({
          ...section,
          restriction: {
            match: 'any',
            hideWhenLocked: !locked,
            locked,
            audience: null,
            conditions: [
              condition({
                type: 'group',
                groupId: GROUP_ID,
                groupName: 'Monday seminar',
              }),
              condition({
                type: 'mark',
                itemKind: 'assignment',
                itemId: ASSIGNMENT_ID,
                itemTitle: 'Quiz',
                atLeast: 50,
              }),
            ],
          },
        })),
      ),
    ),
    http.get(`${SPACE_URL}/assignments`, () =>
      HttpResponse.json(
        offeringAssignments.map(assignment => ({
          ...assignment,
          brief: null,
          dueAt: null,
          restriction: afterAssignment(locked),
        })),
      ),
    ),
  );
}

describe('OfferingOutline restrictions', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('shows a student a locked item as its title and what unlocks it', async () => {
    serve(true);
    render('student');

    const general = await screen.findByRole('region', { name: 'General' });
    const notes = within(general)
      .getAllByRole('listitem')
      .find(item => item.textContent.includes('How marking works'));

    expect(notes).toBeDefined();
    expect(within(notes!).getByText('Locked')).toBeInTheDocument();
    expect(notes).toHaveTextContent('Complete Assignment 1 — sorting first');
    expect(within(notes!).queryByRole('button', { name: /mark as done/i })).toBeNull();
  });

  it('gives a locked assignment no link, and explains a locked section and both its conditions', async () => {
    serve(true);
    render('student');

    const week = await screen.findByRole('region', { name: 'Week 1 — sorting' });

    expect(
      within(week).queryByRole('link', { name: 'Assignment 1 — sorting' }),
    ).toBeNull();
    expect(week).toHaveTextContent('Any one of these:');
    expect(week).toHaveTextContent('Only for group Monday seminar');
    expect(week).toHaveTextContent('Get at least 50 in Quiz');
  });

  it('says nothing to a student once the item is unlocked', async () => {
    serve(false);
    render('student');

    await screen.findByRole('region', { name: 'General' });

    expect(screen.queryByText('Locked')).toBeNull();
  });

  it('badges a restricted item for an author, and says when it is hidden while locked', async () => {
    serve(false);
    render('administrator');

    await screen.findByRole('region', { name: 'General' });

    expect(screen.getAllByText('Restricted').length).toBeGreaterThan(0);
    expect(screen.getByText('Restricted · hidden while locked')).toBeInTheDocument();
  });

  it('saves a restriction an author builds, of a group and a mark', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.patch(`${SPACE_URL}/materials/:materialId`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(learningMaterials[0]);
      }),
    );
    const user = userEvent.setup();
    render('administrator');

    await user.click(
      await screen.findByRole('button', { name: 'Access to The course repository' }),
    );
    const form = screen.getByRole('form', { name: 'Access to The course repository' });

    await user.selectOptions(within(form).getByLabelText('Students need'), 'any');
    await user.selectOptions(within(form).getByLabelText('Condition'), 'group');
    await user.selectOptions(await within(form).findByLabelText('Study group'), GROUP_ID);
    await user.click(within(form).getByRole('button', { name: 'Add a condition' }));
    await user.selectOptions(within(form).getAllByLabelText('Condition')[1]!, 'mark');
    await user.selectOptions(
      within(form).getByLabelText('Assignment'),
      `assignment:${ASSIGNMENT_ID}`,
    );
    await user.type(within(form).getByLabelText('At least (points)'), '50');
    await user.click(within(form).getByRole('switch', { name: /hide it completely/i }));
    await user.click(within(form).getByRole('button', { name: 'Save access' }));

    await waitFor(() => {
      expect(bodies).toEqual([
        {
          restriction: {
            match: 'any',
            hideWhenLocked: true,
            conditions: [
              { type: 'group', groupId: GROUP_ID },
              { type: 'mark', itemId: ASSIGNMENT_ID, atLeast: 50 },
            ],
          },
        },
      ]);
    });
    expect(toast.success).toHaveBeenCalledWith('Access saved');
  });

  it('will not save a condition left half filled in', async () => {
    const user = userEvent.setup();
    render('administrator');

    await user.click(
      await screen.findByRole('button', { name: 'Access to The course repository' }),
    );
    await user.click(screen.getByRole('button', { name: 'Save access' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Fill in every condition before saving.',
    );
  });

  it('offers only tracked items to wait for, never the item itself', async () => {
    const user = userEvent.setup();
    render('administrator');

    await user.click(
      await screen.findByRole('button', { name: 'Access to How marking works' }),
    );
    const item = screen.getByLabelText('Item');
    const options = within(item)
      .getAllByRole('option')
      .map(option => option.textContent);

    expect(options).toEqual(['Choose…', 'Lecture 1 — slides', 'Assignment 1 — sorting']);
  });

  it('removes a restriction', async () => {
    serve(false);
    const bodies: unknown[] = [];
    server.use(
      http.patch(`${SPACE_URL}/sections/:sectionId`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(learningSections[0]);
      }),
    );
    const user = userEvent.setup();
    render('administrator');

    await user.click(
      await screen.findByRole('button', { name: 'Access to Week 1 — sorting' }),
    );
    await user.click(screen.getByRole('button', { name: 'Remove the restriction' }));

    await waitFor(() => {
      expect(bodies).toEqual([{ restriction: null }]);
    });
  });
});
