import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import {
  courseOffering,
  QUESTION_ID,
  QUIZ_ID,
  renderWithProviders,
  screen,
  server,
  userEvent,
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
});
