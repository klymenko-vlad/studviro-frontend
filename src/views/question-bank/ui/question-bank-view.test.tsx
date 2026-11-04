import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import {
  bankQuestions,
  CATEGORY_ID,
  courseOffering,
  QUESTION_ID,
  renderWithProviders,
  screen,
  server,
  userEvent,
  within,
} from '@/shared/test';

import { QuestionBankView } from './question-bank-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const PROXY = '/api/proxy/api/v1';
const SPACE_URL = `${PROXY}/institutions/${INSTITUTION}/learning-spaces/${SPACE}`;

const render = (viewerRole: 'student' | 'teacher' = 'teacher') => {
  server.use(
    http.get(`${PROXY}/institutions/:institutionId/course-offerings/:offeringId`, () =>
      HttpResponse.json({ ...courseOffering, viewerRole }),
    ),
  );

  return renderWithProviders(
    <QuestionBankView
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      spaceId={SPACE}
    />,
  );
};

describe('QuestionBankView', () => {
  it('keeps a student out', async () => {
    render('student');

    expect(
      await screen.findByText("Only the course's teachers can open its question bank."),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Questions' })).toBeNull();
  });

  it('lists categories and questions, and filters questions by category and type', async () => {
    const asked: URLSearchParams[] = [];
    server.use(
      http.get(`${SPACE_URL}/questions`, ({ request }) => {
        asked.push(new URL(request.url).searchParams);
        return HttpResponse.json({
          items: bankQuestions,
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

    const categories = await screen.findByRole('list', { name: 'Categories' });
    const questions = await screen.findByRole('list', { name: 'Questions' });
    expect(within(questions).getByText('Binary search cost')).toBeInTheDocument();
    expect(
      within(questions).getByText('Sorting · 1 mark · version 2'),
    ).toBeInTheDocument();

    await user.click(
      within(categories).getByRole('button', { name: 'Sorting (1 question)' }),
    );
    await user.selectOptions(screen.getByLabelText('Type'), 'essay');

    await vi.waitFor(() => {
      expect(
        asked.some(
          params =>
            params.get('categoryId') === CATEGORY_ID && params.get('type') === 'essay',
        ),
      ).toBe(true);
    });
  });

  it('adds a category', async () => {
    let sent: unknown;
    server.use(
      http.post(`${SPACE_URL}/question-categories`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(
          {
            id: 'ca7e0001-0001-4001-8001-000000000002',
            name: 'Graphs',
            questionCount: 0,
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    render();

    const form = await screen.findByRole('form', { name: 'Add a category' });
    await user.type(within(form).getByLabelText('New category'), 'Graphs');
    await user.click(within(form).getByRole('button', { name: 'Add' }));

    await vi.waitFor(() => {
      expect(sent).toEqual({ name: 'Graphs' });
    });
  });

  it('writes a matching question, refusing it until it has two complete pairs', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.post(`${SPACE_URL}/questions`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    render();

    await user.click(await screen.findByRole('button', { name: 'Write a question' }));
    const form = screen.getByRole('form', { name: 'Write a question' });
    await user.selectOptions(within(form).getByLabelText('Type'), 'matching');
    await user.selectOptions(within(form).getByLabelText('Category'), CATEGORY_ID);
    await user.type(within(form).getByLabelText('Name in the bank'), 'Orders');
    await user.type(within(form).getByLabelText('Question'), 'Match them.');
    await user.type(within(form).getByLabelText('Prompt 1'), 'Stack');
    await user.type(within(form).getByLabelText('Its match 1'), 'LIFO');
    await user.click(within(form).getByRole('button', { name: 'Add the question' }));

    expect(within(form).getByRole('alert')).toHaveTextContent(
      'Give at least two complete pairs.',
    );
    expect(sent).toBeUndefined();

    await user.type(within(form).getByLabelText('Prompt 2'), 'Queue');
    await user.type(within(form).getByLabelText('Its match 2'), 'FIFO');
    await user.click(within(form).getByRole('button', { name: 'Add the question' }));

    await vi.waitFor(() => {
      expect(sent).toEqual({
        type: 'matching',
        categoryId: CATEGORY_ID,
        name: 'Orders',
        text: 'Match them.',
        defaultMark: 1,
        generalFeedback: null,
        pairs: [
          { prompt: 'Stack', answer: 'LIFO' },
          { prompt: 'Queue', answer: 'FIFO' },
        ],
      });
    });
  });

  it('edits a question as a new version, keeping its type', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.put(`${SPACE_URL}/questions/${QUESTION_ID}`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();
    render();

    const questions = await screen.findByRole('list', { name: 'Questions' });
    await user.click(
      within(questions).getByRole('button', { name: 'Edit Binary search cost' }),
    );
    const form = await screen.findByRole('form', { name: 'Edit Binary search cost' });

    expect(within(form).getByLabelText('Type')).toBeDisabled();
    expect(within(form).getByLabelText('Choice 1')).toHaveValue('Θ(log n)');

    await user.click(within(form).getAllByRole('switch')[1]!);
    await user.click(within(form).getByRole('button', { name: 'Save as a new version' }));

    await vi.waitFor(() => {
      expect(sent).toMatchObject({
        choices: [
          { text: 'Θ(log n)', correct: false, feedback: null },
          { text: 'Θ(n)', correct: true, feedback: 'That is a scan.' },
        ],
      });
    });
    expect(sent).not.toHaveProperty('type');
  });
});
