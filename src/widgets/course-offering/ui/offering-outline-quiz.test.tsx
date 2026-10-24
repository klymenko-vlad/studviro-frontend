import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { QuizResponseDto } from '@/shared/api';
import type * as SharedConfig from '@/shared/config';
import {
  ATTEMPT_ID,
  attemptStanding,
  myQuizAttempts,
  offeringQuizzes,
  quizAttempt,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  within,
} from '@/shared/test';

import { OfferingOutline } from './offering-outline';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const push = vi.hoisted(() => vi.fn());
vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ push }),
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const SPACE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}`;
const quiz = offeringQuizzes[0]!;

const render = (
  viewerRole: 'student' | 'teacher',
  quizzes: QuizResponseDto[] = [quiz],
) => {
  server.use(http.get(`${SPACE_URL}/quizzes`, () => HttpResponse.json(quizzes)));

  return renderWithProviders(
    <OfferingOutline
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      spaceId={SPACE}
      viewerRole={viewerRole}
    />,
  );
};

const quizRow = async () =>
  (await screen.findByText('Foundations quiz')).closest('li') as HTMLElement;

describe('a quiz on the course page', () => {
  it('lets a student start an attempt, says how many are left, and lists their attempts', async () => {
    let started = false;
    server.use(
      http.post(`${SPACE_URL}/quizzes/${quiz.id}/attempts`, () => {
        started = true;
        return HttpResponse.json(quizAttempt);
      }),
    );
    const user = userEvent.setup();
    render('student');
    const row = await quizRow();

    expect(within(row).getByText('Quiz')).toBeInTheDocument();
    expect(
      within(row).getByText(
        '10 minutes · 2 attempts · Highest grade counts · 5 questions',
      ),
    ).toBeInTheDocument();
    expect(await within(row).findByRole('status')).toHaveTextContent('1 attempt left');
    const mine = within(row).getByRole('list', {
      name: 'Your attempts at Foundations quiz',
    });
    expect(within(mine).getByText('Attempt 1')).toBeInTheDocument();
    expect(within(mine).getByText(/^Submitted/)).toBeInTheDocument();
    expect(within(mine).getByText('6.25 of 10')).toBeInTheDocument();
    expect(within(mine).getByRole('link', { name: 'Review attempt 1' })).toHaveAttribute(
      'href',
      expect.stringMatching(/\/attempts\/a77e0001-0001-4001-8001-000000000000$/),
    );
    expect(within(row).queryByText(/points|score/i)).toBeNull();

    await user.click(within(row).getByRole('button', { name: 'Start attempt' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        `/institutions/${INSTITUTION}/courses/${OFFERING}/spaces/${SPACE}/quizzes/${quiz.id}/attempts/${ATTEMPT_ID}`,
      );
    });
    expect(started).toBe(true);
  });

  it('shows no mark and no review link while the quiz keeps them back', async () => {
    server.use(
      http.get(`${SPACE_URL}/quizzes/${quiz.id}/attempts/mine`, () =>
        HttpResponse.json({
          items: [{ ...myQuizAttempts[0]!, review: { available: false, score: null } }],
          meta: {
            page: 1,
            limit: 5,
            total: 1,
            pageCount: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          standing: attemptStanding,
        }),
      ),
    );
    render('student');
    const row = await quizRow();
    const mine = await within(row).findByRole('list', {
      name: 'Your attempts at Foundations quiz',
    });

    expect(within(mine).queryByText(/of 10/)).toBeNull();
    expect(within(mine).queryByRole('link')).toBeNull();
  });

  it('offers to continue the attempt in progress', async () => {
    server.use(
      http.get(`${SPACE_URL}/quizzes/${quiz.id}/attempts/mine`, () =>
        HttpResponse.json({
          items: [],
          meta: {
            page: 1,
            limit: 5,
            total: 0,
            pageCount: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          standing: { ...attemptStanding, inProgressId: ATTEMPT_ID, used: 0 },
        }),
      ),
    );
    render('student');
    const row = await quizRow();

    expect(
      await within(row).findByRole('link', { name: 'Continue attempt' }),
    ).toHaveAttribute('href', expect.stringContaining(`/attempts/${ATTEMPT_ID}`));
    expect(within(row).queryByRole('button', { name: 'Start attempt' })).toBeNull();
  });

  it.each([
    ['closed', 'This quiz has closed.'],
    ['no_attempts_left', 'You have used every attempt.'],
    ['upcoming', /^Attempts open on/],
  ] as const)(
    'says why a student cannot start when it is %s',
    async (blockedBy, text) => {
      server.use(
        http.get(`${SPACE_URL}/quizzes/${quiz.id}/attempts/mine`, () =>
          HttpResponse.json({
            items: [],
            meta: {
              page: 1,
              limit: 5,
              total: 0,
              pageCount: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
            standing: { ...attemptStanding, used: 0, blockedBy },
          }),
        ),
      );
      render('student');
      const row = await quizRow();

      expect(await within(row).findByRole('status')).toHaveTextContent(text);
      expect(within(row).queryByRole('button', { name: 'Start attempt' })).toBeNull();
    },
  );

  it('shows only the title and when it opens to a student before it is available', async () => {
    render('student', [
      {
        ...quiz,
        brief: null,
        settings: null,
        availability: 'scheduled',
        availableFrom: '2030-01-01T08:00:00.000Z',
      },
    ]);
    const row = await quizRow();

    expect(within(row).queryByRole('button', { name: 'Start attempt' })).toBeNull();
    expect(within(row).getByText(/Opens/)).toBeInTheDocument();
  });

  it('links an author to the quiz editor and the question bank', async () => {
    render('teacher');
    const row = await quizRow();

    expect(within(row).getByRole('link', { name: 'Foundations quiz' })).toHaveAttribute(
      'href',
      expect.stringContaining(`/spaces/${SPACE}/quizzes/${quiz.id}`),
    );
    expect(within(row).queryByRole('button', { name: 'Start attempt' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Question bank' })).toHaveAttribute(
      'href',
      expect.stringContaining(`/spaces/${SPACE}/question-bank`),
    );
  });

  it('adds a hidden quiz to a section by name and links to setting it up', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.post(`${SPACE_URL}/quizzes`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...quiz, ...sent }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    render('teacher');

    const week = await screen.findByRole('region', { name: 'Week 1 — sorting' });
    await user.click(
      within(week).getByRole('button', { name: 'Add quiz to Week 1 — sorting' }),
    );
    const form = within(week).getByRole('form', { name: 'Add a quiz' });
    await user.type(within(form).getByLabelText('Name'), 'Week 2 quiz');
    await user.click(within(form).getByRole('button', { name: 'Add the quiz' }));

    expect(
      await within(week).findByRole('link', {
        name: 'Set up Week 2 quiz: its questions and settings',
      }),
    ).toHaveAttribute('href', expect.stringContaining('/quizzes/'));
    expect(sent).toEqual({
      name: 'Week 2 quiz',
      visible: false,
      sectionId: '5ec70001-0001-4001-8001-000000000001',
    });
  });

  it('lets a restriction wait for a mark in a quiz', async () => {
    const user = userEvent.setup();
    render('teacher');

    await quizRow();
    const general = screen.getByRole('region', { name: 'General' });
    const [access] = within(general).getAllByRole('button', { name: /^Access to/ });
    await user.click(access!);
    const form = within(general).getByRole('form', { name: /^Access to/ });
    await user.selectOptions(within(form).getByLabelText('Condition'), 'mark');

    const items = within(form).getByLabelText('Assignment or quiz');
    expect(
      within(items).getByRole('option', { name: 'Foundations quiz' }),
    ).toBeInTheDocument();
  });
});
