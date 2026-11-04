import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type { QuizAttemptResponseDto } from '@/shared/api';
import {
  ATTEMPT_ID,
  attemptForMarking,
  attemptReview,
  courseOffering,
  expectNoAxeViolations,
  finishedAttempt,
  QUIZ_ID,
  quizAttempt,
  renderWithProviders,
  screen,
  server,
  userEvent,
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
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeInTheDocument();
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
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

  it('reviews a closed attempt read-only, saying right and wrong in words', async () => {
    const { container } = render(finishedAttempt);

    expect(
      await screen.findByText('Your mark: 6 of 10 (3 of 5 marks)'),
    ).toBeInTheDocument();
    const first = screen.getByRole('region', { name: 'Question 1' });
    expect(within(first).getByRole('radio', { name: 'Θ(n)' })).toBeChecked();
    expect(within(first).getByRole('radio', { name: 'Θ(n)' })).toBeDisabled();
    expect(within(first).getByText('Incorrect')).toBeInTheDocument();
    expect(within(first).getByText('0 of 1 marks')).toBeInTheDocument();
    expect(within(first).getByText('Θ(log n)', { selector: 'li' })).toBeInTheDocument();
    expect(within(first).getByText('That is a scan.')).toBeInTheDocument();
    expect(within(first).getByText('It halves the range.')).toBeInTheDocument();

    const essay = screen.getByRole('region', { name: 'Question 2' });
    expect(within(essay).getByText('Partly correct')).toBeInTheDocument();
    expect(within(essay).getByRole('textbox')).toHaveValue(
      'A settled vertex stays settled.',
    );
    expect(
      within(essay).getByText('Say why a negative edge breaks it.'),
    ).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('says what the quiz keeps back and when more is shown', async () => {
    server.use(
      http.get(`${ATTEMPT_URL}/review`, () =>
        HttpResponse.json({
          ...attemptReview,
          shown: { ...attemptReview.shown, responses: false, correctAnswer: false },
          score: null,
          revealsAt: '2026-11-30T23:00:00.000Z',
          questions: [],
        }),
      ),
    );
    render(finishedAttempt);

    expect(await screen.findByText(/does not show your mark/)).toBeInTheDocument();
    expect(screen.getByText(/More is shown once the quiz closes/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Question 1' })).toBeNull();
  });

  it('says an attempt waits for marking rather than showing a provisional mark', async () => {
    server.use(
      http.get(`${ATTEMPT_URL}/review`, () =>
        HttpResponse.json({
          ...attemptReview,
          score: {
            ...attemptReview.score!,
            points: null,
            rawMarks: null,
            awaitingMarking: true,
          },
        }),
      ),
    );
    render(finishedAttempt);

    expect(await screen.findByText(/waits for a teacher to mark/)).toBeInTheDocument();
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

const renderAsTeacher = () => {
  server.use(
    http.get(
      `/api/proxy/api/v1/institutions/:institutionId/course-offerings/:offeringId`,
      () => HttpResponse.json({ ...courseOffering, viewerRole: 'teacher' }),
    ),
  );

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

const captureMarks = () => {
  const marks: { position: string; body: unknown }[] = [];
  server.use(
    http.put(`${ATTEMPT_URL}/questions/:position/mark`, async ({ request, params }) => {
      marks.push({ position: String(params['position']), body: await request.json() });
      return HttpResponse.json(attemptForMarking);
    }),
  );

  return marks;
};

describe('QuizAttemptView for the course’s teachers', () => {
  it('shows each answer beside the right one, and marks an essay with a comment', async () => {
    const marks = captureMarks();
    const user = userEvent.setup();
    const { container } = renderAsTeacher();

    expect(await screen.findByText('Marek Novák, attempt 2')).toBeInTheDocument();
    expect(screen.getByText(/1 question waits for your mark/)).toBeInTheDocument();
    const first = screen.getByRole('region', { name: 'Question 1' });
    expect(within(first).getByText('Θ(n)')).toBeInTheDocument();
    expect(within(first).getByText('Θ(log n)')).toBeInTheDocument();
    expect(within(first).getByText('Incorrect')).toBeInTheDocument();

    const essay = screen.getByRole('region', { name: 'Question 2' });
    expect(
      within(essay).getByText('A settled vertex stays settled.'),
    ).toBeInTheDocument();
    await user.type(within(essay).getByLabelText('Mark'), '5');
    await user.click(within(essay).getByRole('button', { name: 'Save the mark' }));
    expect(within(essay).getByRole('alert')).toHaveTextContent(
      'Give a mark from 0 to 4.',
    );
    expect(marks).toEqual([]);

    await user.clear(within(essay).getByLabelText('Mark'));
    await user.type(within(essay).getByLabelText('Mark'), '3,5');
    await user.type(
      within(essay).getByLabelText('Comment for the student (optional)'),
      'Good.',
    );
    await user.click(within(essay).getByRole('button', { name: 'Save the mark' }));
    await waitFor(() => {
      expect(marks).toEqual([{ position: '1', body: { mark: 3.5, comment: 'Good.' } }]);
    });
    await expectNoAxeViolations(container);
  });

  it('asks why before changing an automatic mark', async () => {
    const marks = captureMarks();
    const user = userEvent.setup();
    renderAsTeacher();

    const first = await screen.findByRole('region', { name: 'Question 1' });
    await user.type(within(first).getByLabelText('Change the mark'), '1');
    await user.click(within(first).getByRole('button', { name: 'Save the mark' }));
    expect(within(first).getByRole('alert')).toHaveTextContent(
      'Say why the automatic mark changes.',
    );

    await user.type(within(first).getByLabelText('Why the mark changes'), 'Ambiguous.');
    await user.click(within(first).getByRole('button', { name: 'Save the mark' }));
    await waitFor(() => {
      expect(marks).toEqual([
        { position: '0', body: { mark: 1, comment: 'Ambiguous.' } },
      ]);
    });
  });

  it('takes a changed mark away', async () => {
    const marks = captureMarks();
    server.use(
      http.get(`${ATTEMPT_URL}/marking`, () =>
        HttpResponse.json({
          ...attemptForMarking,
          questions: [
            { ...attemptForMarking.questions[0]!, manualMark: 1, comment: 'Ambiguous.' },
            attemptForMarking.questions[1],
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderAsTeacher();

    const first = await screen.findByRole('region', { name: 'Question 1' });
    expect(within(first).getByLabelText('Change the mark')).toHaveValue('1');
    await user.click(
      within(first).getByRole('button', { name: 'Go back to the automatic mark' }),
    );
    await waitFor(() => {
      expect(marks).toEqual([{ position: '0', body: { mark: null, comment: null } }]);
    });
  });
});
