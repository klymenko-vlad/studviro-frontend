import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import {
  courseOffering,
  QUESTION_ID,
  questionResults,
  QUIZ_ID,
  quizAttemptRows,
  regradePreview,
  renderWithProviders,
  screen,
  server,
  userEvent,
  waitFor,
  within,
} from '@/shared/test';

import { QuizEditorView } from './quiz-editor-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const PROXY = '/api/proxy/api/v1';
const QUIZ_URL = `${PROXY}/institutions/${INSTITUTION}/learning-spaces/${SPACE}/quizzes/${QUIZ_ID}`;

const render = (viewerRole: 'student' | 'teacher' = 'teacher') => {
  server.use(
    http.get(`${PROXY}/institutions/:institutionId/course-offerings/:offeringId`, () =>
      HttpResponse.json({ ...courseOffering, viewerRole }),
    ),
  );

  return renderWithProviders(
    <QuizEditorView
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      spaceId={SPACE}
      quizId={QUIZ_ID}
    />,
  );
};

describe('QuizEditorView', () => {
  it('keeps a student out, without asking for the quiz’s questions', async () => {
    const slots = vi.fn();
    server.use(http.get(`${QUIZ_URL}/slots`, slots));
    render('student');

    expect(
      await screen.findByText("Only the course's teachers can edit its quizzes."),
    ).toBeInTheDocument();
    expect(slots).not.toHaveBeenCalled();
  });

  it('lists the questions in order with their totals, and their settings', async () => {
    render();

    const list = await screen.findByRole('list', {
      name: 'Questions in Foundations quiz',
    });
    const rows = within(list).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Binary search cost');
    expect(rows[0]).toHaveTextContent('Single choice · version 2');
    expect(rows[1]).toHaveTextContent('1 random question from Sorting');
    expect(screen.getByText('2 questions · 3 marks in total')).toBeInTheDocument();
    expect(
      screen.getByRole('form', { name: 'Settings of Foundations quiz' }),
    ).toBeInTheDocument();
  });

  it('moves a question down, changes a mark and takes a question out', async () => {
    const patches: unknown[] = [];
    const removed = vi.fn();
    server.use(
      http.patch(`${QUIZ_URL}/slots/:slotId`, async ({ request }) => {
        patches.push(await request.json());
        return HttpResponse.json({});
      }),
      http.delete(`${QUIZ_URL}/slots/:slotId`, () => {
        removed();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    render();

    const list = await screen.findByRole('list', {
      name: 'Questions in Foundations quiz',
    });
    await user.click(
      within(list).getByRole('button', { name: 'Move Binary search cost down' }),
    );
    const mark = within(list).getAllByLabelText('Mark')[0]!;
    await user.clear(mark);
    await user.type(mark, '2.5');
    await user.tab();
    await user.click(
      within(list).getByRole('button', {
        name: 'Take Binary search cost out of the quiz',
      }),
    );

    await vi.waitFor(() => {
      expect(patches).toEqual([{ position: 1 }, { mark: 2.5 }]);
      expect(removed).toHaveBeenCalledOnce();
    });
    expect(
      within(list).getByRole('button', { name: 'Move Binary search cost up' }),
    ).toBeDisabled();
  });

  it('adds a question from the bank by hand, and a random draw from a category', async () => {
    const added: unknown[] = [];
    server.use(
      http.post(`${QUIZ_URL}/slots`, async ({ request }) => {
        added.push(await request.json());
        return HttpResponse.json([], { status: 201 });
      }),
    );
    const user = userEvent.setup();
    render();

    await user.click(await screen.findByRole('button', { name: 'Add from the bank' }));
    const bank = screen.getByRole('region', { name: 'Questions in the bank' });
    await user.click(
      await within(bank).findByRole('button', {
        name: 'Add Binary search cost to the quiz',
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Add random questions' }));
    const draw = screen.getByRole('form', { name: 'Draw random questions' });
    await within(draw).findByRole('option', { name: 'Sorting (1 question)' });
    await user.selectOptions(
      within(draw).getByLabelText('Category'),
      'Sorting (1 question)',
    );
    await user.clear(within(draw).getByLabelText('Mark each'));
    await user.type(within(draw).getByLabelText('Mark each'), '2');
    await user.click(within(draw).getByRole('button', { name: 'Add the draw' }));

    await vi.waitFor(() => {
      expect(added).toEqual([
        { kind: 'question', questionIds: [QUESTION_ID] },
        {
          kind: 'random',
          categoryId: 'ca7e0001-0001-4001-8001-000000000001',
          pickCount: 1,
          mark: 2,
        },
      ]);
    });
  });

  it('lists every attempt a page at a time, filtered by student and state, with provisional scores', async () => {
    const queries: string[] = [];
    server.use(
      http.get(`${QUIZ_URL}/attempts`, ({ request }) => {
        queries.push(new URL(request.url).search);
        return HttpResponse.json({
          items: [quizAttemptRows[0]],
          meta: {
            page: 1,
            limit: 20,
            total: 1,
            pageCount: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }),
    );
    const user = userEvent.setup();
    render();

    const table = await screen.findByRole('table', {
      name: 'Attempts at Foundations quiz',
    });
    const [, row] = within(table).getAllByRole('row');
    expect(within(row!).getByText('Marek Novák')).toBeInTheDocument();
    expect(within(row!).getByText('Submitted')).toBeInTheDocument();
    expect(within(row!).getByText('6.25 of 10, provisional')).toBeInTheDocument();
    expect(within(row!).getByText('An essay needs marking')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Find a student'), 'marek');
    await user.selectOptions(screen.getByLabelText('State'), 'finished');
    await waitFor(() => {
      expect(queries.at(-1)).toContain('q=marek');
    });
    expect(queries.at(-1)).toContain('state=finished');
    expect(queries.at(-1)).toContain('limit=20');

    await user.selectOptions(screen.getByLabelText('State'), 'needs_marking');
    await waitFor(() => {
      expect(queries.at(-1)).toContain('needsMarking=true');
    });
    expect(queries.at(-1)).not.toContain('state=');
    expect(
      within(row!).getByRole('link', { name: 'Mark attempt 1 by Marek Novák' }),
    ).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses/${OFFERING}/spaces/${SPACE}/quizzes/${QUIZ_ID}/attempts/${quizAttemptRows[0]!.id}`,
    );
  });

  it('offers a regrade with its preview, and applies it only once confirmed', async () => {
    const applied = vi.fn();
    server.use(
      http.post(`${QUIZ_URL}/regrade`, () => {
        applied();
        return HttpResponse.json({ ...regradePreview, applied: true });
      }),
    );
    const user = userEvent.setup();
    render();

    expect(
      await screen.findByText('3 closed attempts used an earlier version of a question.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2 attempts change their score and 2 students their grade/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The largest rise is 2.5 points, the largest fall 0/),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 question cannot be regraded/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Regrade…' }));
    expect(applied).not.toHaveBeenCalled();
    await user.click(
      within(screen.getByRole('group', { name: 'Confirm the regrade' })).getByRole(
        'button',
        {
          name: 'Regrade now',
        },
      ),
    );
    await waitFor(() => {
      expect(applied).toHaveBeenCalledOnce();
    });
  });

  it('says nothing about regrading when every attempt asks the latest versions', async () => {
    server.use(
      http.get(`${QUIZ_URL}/regrade`, () =>
        HttpResponse.json({
          ...regradePreview,
          outdatedAttempts: 0,
          regradedAttempts: 0,
        }),
      ),
    );
    render();

    await screen.findByRole('table', { name: 'Results by question in Foundations quiz' });
    expect(screen.queryByRole('button', { name: 'Regrade…' })).toBeNull();
  });

  it('shows how each question went, with the answers picked, a page at a time and filtered', async () => {
    const queries: string[] = [];
    server.use(
      http.get(`${QUIZ_URL}/results`, ({ request }) => {
        queries.push(new URL(request.url).search);
        return HttpResponse.json({
          items: questionResults,
          meta: {
            page: 1,
            limit: 20,
            total: 1,
            pageCount: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }),
    );
    const user = userEvent.setup();
    render();

    const table = await screen.findByRole('table', {
      name: 'Results by question in Foundations quiz',
    });
    const [, row] = within(table).getAllByRole('row');
    expect(within(row!).getByText('Binary search cost')).toBeInTheDocument();
    expect(within(row!).getByText('75 %')).toBeInTheDocument();
    expect(within(row!).getByText('0.75 of 1')).toBeInTheDocument();
    expect(within(row!).getByText('Θ(log n): 3 (right)')).toBeInTheDocument();
    expect(within(row!).getByText('Θ(n): 1')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Find a question'), 'binary');
    await waitFor(() => {
      expect(queries.at(-1)).toContain('q=binary');
    });
  });

  it('sets what students see after an attempt, and when', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.patch(QUIZ_URL, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    render();

    const review = await screen.findByRole('group', {
      name: 'What students see after an attempt',
    });
    expect(within(review).getByLabelText('The right answers')).toHaveValue('after_close');
    await user.selectOptions(
      within(review).getByLabelText('The mark for the attempt'),
      'never',
    );
    await user.click(screen.getByRole('button', { name: 'Save the settings' }));

    await waitFor(() => {
      expect(sent).toMatchObject({
        review: {
          responses: 'immediately',
          correctness: 'immediately',
          correctAnswer: 'after_close',
          feedback: 'never',
          overallMark: 'never',
        },
      });
    });
  });

  it('lets the author choose one question per page or all on one', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.patch(QUIZ_URL, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    render();

    await user.selectOptions(
      await screen.findByLabelText('Questions per page'),
      'all_on_one',
    );
    await user.click(screen.getByRole('button', { name: 'Save the settings' }));

    await waitFor(() => {
      expect(sent).toMatchObject({ layout: 'all_on_one' });
    });
  });
});
