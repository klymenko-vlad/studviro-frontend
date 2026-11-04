import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  renderWithProviders,
  screen,
  server,
  studentView,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingOutline } from './offering-outline';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const SPACE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}`;
const ALAN = '22222222-2222-4222-8222-222222222222';

const render = (viewerRole: 'student' | 'administrator') =>
  renderWithProviders(
    <OfferingOutline
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      spaceId={SPACE}
      viewerRole={viewerRole}
    />,
  );

function captureViews() {
  const asked: (string | null)[] = [];
  const writes: string[] = [];
  server.use(
    http.get(`${SPACE_URL}/student-view`, ({ request }) => {
      asked.push(new URL(request.url).searchParams.get('asStudent'));
      return undefined;
    }),
    http.post(`${SPACE_URL}/materials/:materialId/views`, ({ request }) => {
      writes.push(request.url);
      return new HttpResponse(null, { status: 204 });
    }),
    http.put(`${SPACE_URL}/my-completions/:kind/:itemId`, ({ request }) => {
      writes.push(request.url);
      return new HttpResponse(null, { status: 204 });
    }),
  );

  return { asked, writes };
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'View as a student' }));

  return screen.getByRole('region', { name: 'View the page as' });
}

describe('OfferingOutline view as a student', () => {
  it('is not offered to a student', async () => {
    render('student');

    expect(await screen.findByRole('region', { name: 'General' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View as a student' })).toBeNull();
  });

  it('shows the page as a new student, read-only, and goes back to editing', async () => {
    const { asked, writes } = captureViews();
    const user = userEvent.setup();
    render('administrator');

    const picker = await openPicker(user);
    await user.click(within(picker).getByRole('button', { name: /A new student/ }));

    expect(await screen.findByText('Viewing as a new student')).toBeInTheDocument();
    expect(asked).toEqual([null]);
    expect(await screen.findByText('Lecture 1 — slides')).toBeInTheDocument();
    expect(screen.queryByText('The course repository')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Add material/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Download/ })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Mark How marking works as done' }),
    ).toBeDisabled();
    expect(screen.getByText('Assignment 1 — sorting').closest('a')).toBeNull();
    expect(
      screen.getByRole('progressbar', { name: 'Your progress' }),
    ).toBeInTheDocument();
    expect(writes).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Back to editing' }));

    expect(screen.queryByText('Viewing as a new student')).toBeNull();
    expect(await screen.findByText('The course repository')).toBeInTheDocument();
  });

  it('finds an enrolled student by name and shows the page as them', async () => {
    const { asked } = captureViews();
    const user = userEvent.setup();
    render('administrator');

    const picker = await openPicker(user);
    expect(
      await within(picker).findByRole('button', { name: /Ada Lovelace/ }),
    ).toBeInTheDocument();

    await user.type(within(picker).getByLabelText('Find a student'), 'alan');
    await waitFor(() => {
      expect(within(picker).queryByRole('button', { name: /Ada Lovelace/ })).toBeNull();
    });
    await user.click(within(picker).getByRole('button', { name: /Alan Turing/ }));

    expect(await screen.findByText('Viewing as Alan Turing')).toBeInTheDocument();
    expect(asked).toEqual([ALAN]);
    expect(screen.queryByRole('region', { name: 'View the page as' })).toBeNull();
  });

  it('chooses another student from the banner', async () => {
    const user = userEvent.setup();
    render('administrator');

    const picker = await openPicker(user);
    await user.click(within(picker).getByRole('button', { name: /A new student/ }));
    await user.click(
      await screen.findByRole('button', { name: 'Choose another student' }),
    );

    expect(screen.getByRole('region', { name: 'View the page as' })).toBeInTheDocument();
  });

  it('says when nobody matches the search', async () => {
    const user = userEvent.setup();
    render('administrator');

    const picker = await openPicker(user);
    await user.type(within(picker).getByLabelText('Find a student'), 'nobody');

    expect(await within(picker).findByText('No student matches.')).toBeInTheDocument();
  });

  it('says when the page cannot be shown, and still goes back', async () => {
    server.use(
      http.get(`${SPACE_URL}/student-view`, () =>
        HttpResponse.json({ message: 'Not enrolled' }, { status: 404 }),
      ),
    );
    const user = userEvent.setup();
    render('administrator');

    const picker = await openPicker(user);
    await user.click(within(picker).getByRole('button', { name: /A new student/ }));

    expect(
      await screen.findByText('The page could not be shown as this student.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to editing' }));
    expect(await screen.findByText('The course repository')).toBeInTheDocument();
  });

  it('shows an empty page as the student would', async () => {
    server.use(
      http.get(`${SPACE_URL}/student-view`, () =>
        HttpResponse.json({
          ...studentView,
          sections: [],
          materials: [],
          assignments: [],
          quizzes: [],
          progress: { done: 0, total: 0, sections: [], items: [] },
        }),
      ),
    );
    const user = userEvent.setup();
    render('administrator');

    const picker = await openPicker(user);
    await user.click(within(picker).getByRole('button', { name: /A new student/ }));

    expect(
      await screen.findByText('Nothing has been put on this course page yet.'),
    ).toBeInTheDocument();
  });
});
