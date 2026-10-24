import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { QuizAttemptResponseDto } from '@/shared/api';
import {
  ATTEMPT_ID,
  expectNoAxeViolations,
  finishedAttempt,
  QUIZ_ID,
  quizAttempt,
  renderWithProviders,
  screen,
  server,
  waitFor,
  within,
} from '@/shared/test';

import { QuizAttemptView } from './quiz-attempt-view';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const OFFERING = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SPACE = '9a1f0b3c-1111-4111-8111-111111111111';
const ATTEMPT_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces/${SPACE}/quizzes/${QUIZ_ID}/attempts/${ATTEMPT_ID}`;

const render = (attempt: QuizAttemptResponseDto = quizAttempt) => {
  server.use(http.get(ATTEMPT_URL, () => HttpResponse.json(attempt)));

  return renderWithProviders(
    <QuizAttemptView
      institutionId={INSTITUTION}
      offeringId={OFFERING}
      spaceId={SPACE}
      quizId={QUIZ_ID}
      attemptId={ATTEMPT_ID}
    />,
  );
};

const captureSaves = () => {
  const saves: { position: string; body: unknown }[] = [];
  server.use(
    http.put(`${ATTEMPT_URL}/answers/:position`, async ({ request, params }) => {
      const body = await request.json();
      saves.push({ position: String(params['position']), body });

      return HttpResponse.json({
        position: Number(params['position']),
        answered: true,
        response: null,
        savedAt: '2026-10-24T08:02:00.000Z',
        remainingSeconds: 480,
      });
    }),
  );

  return saves;
};

describe('taking a quiz', () => {
  it('shows one question at a time, with the server’s time left and which are answered', async () => {
    const { container } = render();

    expect(
      await screen.findByRole('heading', { name: 'Question 1' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Question 2' })).toBeNull();
    expect(screen.getByRole('timer', { name: 'Time left' })).toHaveTextContent('10:00');
    expect(screen.getByText('1 of 6 answered')).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Questions' });
    expect(
      within(nav).getByRole('button', { name: 'Question 1, answered' }),
    ).toHaveAttribute('aria-current', 'step');
    expect(
      within(nav).getByRole('button', { name: 'Question 2, not answered' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /binary search/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Θ(log n)' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Previous question' })).toBeDisabled();

    await expectNoAxeViolations(container);
  });

  it('moves between questions and puts focus on the question shown', async () => {
    const { user } = render();
    await screen.findByRole('heading', { name: 'Question 1' });

    await user.click(screen.getByRole('button', { name: 'Next question' }));
    expect(screen.getByRole('heading', { name: 'Question 2' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Question 5, not answered' }));
    expect(screen.getByRole('heading', { name: 'Question 5' })).toHaveFocus();
    expect(screen.getByLabelText('Stack')).toHaveRole('combobox');
  });

  it('saves each answer as it is given and says so', async () => {
    const saves = captureSaves();
    const { user } = render();
    await screen.findByRole('heading', { name: 'Question 1' });

    await user.click(screen.getByRole('button', { name: 'Next question' }));
    await user.click(screen.getByRole('checkbox', { name: 'Merge sort' }));

    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(saves).toEqual([{ position: '1', body: { choices: [0] } }]);
    expect(
      screen.getByRole('button', { name: 'Question 2, answered' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Question 5, not answered' }));
    await user.selectOptions(screen.getByLabelText('Stack'), 'LIFO');
    await waitFor(() => {
      expect(saves.at(-1)).toEqual({
        position: '4',
        body: { pairs: [{ prompt: 0, answer: 0 }] },
      });
    });
  });

  it('saves typed answers once the typing pauses, not on every key', async () => {
    const saves = captureSaves();
    const { user } = render();
    await screen.findByRole('heading', { name: 'Question 1' });

    await user.click(screen.getByRole('button', { name: 'Question 4, not answered' }));
    await user.type(screen.getByLabelText('Your answer, as a number'), '11');

    await waitFor(() => {
      expect(saves).toEqual([{ position: '3', body: { text: '11' } }]);
    });
  });

  it('asks before submitting, names the unanswered questions, and ends on a clear state', async () => {
    let submitted = false;
    server.use(
      http.post(`${ATTEMPT_URL}/submit`, () => {
        submitted = true;
        return HttpResponse.json(finishedAttempt);
      }),
    );
    const { user } = render();
    await screen.findByRole('heading', { name: 'Question 1' });

    await user.click(screen.getByRole('button', { name: 'Finish the attempt' }));
    const confirm = screen.getByRole('region', { name: 'Submit your attempt?' });
    expect(
      within(confirm).getByRole('heading', { name: 'Submit your attempt?' }),
    ).toHaveFocus();
    expect(within(confirm).getByText('5 questions have no answer:')).toBeInTheDocument();
    expect(
      within(confirm).getAllByRole('button', { name: /^Question \d$/ }),
    ).toHaveLength(5);

    await user.click(within(confirm).getByRole('button', { name: 'Question 3' }));
    expect(screen.getByRole('heading', { name: 'Question 3' })).toHaveFocus();
    expect(submitted).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Finish the attempt' }));
    await user.click(screen.getByRole('button', { name: 'Submit the attempt' }));

    expect(
      await screen.findByRole('heading', { name: 'Attempt 2 is submitted' }),
    ).toHaveFocus();
    expect(submitted).toBe(true);
    expect(screen.getByText(/^You submitted it/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the course' })).toBeInTheDocument();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('puts every question on one page when the quiz says so', async () => {
    render({ ...quizAttempt, layout: 'all_on_one' });

    expect(await screen.findAllByRole('heading', { name: /^Question \d$/ })).toHaveLength(
      6,
    );
    expect(screen.queryByRole('button', { name: 'Next question' })).toBeNull();
  });

  it('submits what was saved when the server says the time is up', async () => {
    let submitted = false;
    server.use(
      http.put(`${ATTEMPT_URL}/answers/:position`, () =>
        HttpResponse.json(
          {
            statusCode: 409,
            code: 'QUIZ_ATTEMPT_CLOSED',
            message: 'This attempt has closed',
          },
          { status: 409 },
        ),
      ),
      http.post(`${ATTEMPT_URL}/submit`, () => {
        submitted = true;
        return HttpResponse.json({ ...finishedAttempt, closedBy: 'time_limit' });
      }),
    );
    const { user } = render();
    await screen.findByRole('heading', { name: 'Question 1' });

    await user.click(screen.getByRole('radio', { name: 'Θ(n)' }));

    expect(await screen.findByText(/^The time limit ran out/)).toBeInTheDocument();
    expect(submitted).toBe(true);
  });

  it('submits on its own when the clock reaches zero', async () => {
    let submitted = false;
    server.use(
      http.post(`${ATTEMPT_URL}/submit`, () => {
        submitted = true;
        return HttpResponse.json({ ...finishedAttempt, closedBy: 'time_limit' });
      }),
    );
    render({ ...quizAttempt, remainingSeconds: 0 });

    expect(
      await screen.findByRole('heading', { name: 'Attempt 2 is submitted' }),
    ).toBeInTheDocument();
    expect(submitted).toBe(true);
  });

  it('shows a closed attempt as submitted, with no questions', async () => {
    render(finishedAttempt);

    expect(
      await screen.findByRole('heading', { name: 'Attempt 2 is submitted' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Questions' })).toBeNull();
  });

  it('says so when the attempt cannot be loaded', async () => {
    server.use(
      http.get(ATTEMPT_URL, () =>
        HttpResponse.json({ statusCode: 404, message: 'Not found' }, { status: 404 }),
      ),
    );
    renderWithProviders(
      <QuizAttemptView
        institutionId={INSTITUTION}
        offeringId={OFFERING}
        spaceId={SPACE}
        quizId={QUIZ_ID}
        attemptId={ATTEMPT_ID}
      />,
    );

    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
  });
});
