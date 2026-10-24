import { http, HttpResponse } from 'msw';

import type {
  MyQuizAttemptDto,
  QuestionCategoryResponseDto,
  QuestionResponseDto,
  QuestionSummaryDto,
  QuizAttemptMarkingResponseDto,
  QuizAttemptResponseDto,
  QuizAttemptReviewResponseDto,
  QuizAttemptRowDto,
  QuizAttemptStandingDto,
  QuizQuestionResultDto,
  QuizRegradeResponseDto,
  QuizResponseDto,
  QuizSlotResponseDto,
  SaveQuizAnswerDto,
} from '@/shared/api';

const PROXY = '/api/proxy/api/v1';
const SPACE = `${PROXY}/institutions/:institutionId/learning-spaces/:spaceId`;

export const QUIZ_ID = 'a0a0a0a0-0001-4001-8001-000000000001';
export const CATEGORY_ID = 'ca7e0001-0001-4001-8001-000000000001';
export const QUESTION_ID = '9e570001-0001-4001-8001-000000000001';

const page = <T>(items: T[]) => ({
  items,
  meta: {
    page: 1,
    limit: 20,
    total: items.length,
    pageCount: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
});

export const offeringQuizzes: QuizResponseDto[] = [
  {
    id: QUIZ_ID,
    learningSpaceId: '9a1f0b3c-1111-4111-8111-111111111111',
    assessmentId: 'a5a5a5a5-0001-4001-8001-000000000001',
    name: 'Foundations quiz',
    brief: 'Searching and sorting.',
    opensAt: '2026-10-05T07:00:00.000Z',
    closesAt: '2026-11-30T23:00:00.000Z',
    maxPoints: 10,
    countsTowardFinalGrade: true,
    position: 5,
    visible: true,
    sectionId: '5ec70001-0001-4001-8001-000000000001',
    completionRule: 'none',
    completionPassPoints: null,
    settings: {
      timeLimitMinutes: 10,
      maxAttempts: 2,
      gradingMethod: 'highest',
      shuffleQuestions: false,
      shuffleChoices: true,
      layout: 'one_per_page',
      review: {
        responses: 'immediately',
        correctness: 'immediately',
        correctAnswer: 'after_close',
        feedback: 'never',
        overallMark: 'after_close',
      },
      questionCount: 5,
      attempts: 'open',
    },
    availableFrom: null,
    availableUntil: null,
    hiddenUntilAvailable: false,
    availability: 'open',
    restriction: null,
  },
];

export const questionCategories: QuestionCategoryResponseDto[] = [
  { id: CATEGORY_ID, name: 'Sorting', questionCount: 1 },
];

export const bankQuestions: QuestionSummaryDto[] = [
  {
    id: QUESTION_ID,
    categoryId: CATEGORY_ID,
    categoryName: 'Sorting',
    type: 'single_choice',
    version: 2,
    name: 'Binary search cost',
    text: 'How many comparisons does binary search make?',
    defaultMark: 1,
    updatedAt: '2026-10-20T08:00:00.000Z',
  },
];

export const bankQuestion: QuestionResponseDto = {
  ...bankQuestions[0]!,
  generalFeedback: 'It halves the range.',
  choices: [
    { text: 'Θ(log n)', correct: true, feedback: null },
    { text: 'Θ(n)', correct: false, feedback: 'That is a scan.' },
  ],
  correct: null,
  trueFeedback: null,
  falseFeedback: null,
  acceptedAnswers: null,
  caseSensitive: null,
  value: null,
  tolerance: null,
  pairs: null,
  createdAt: '2026-10-20T08:00:00.000Z',
};

export const quizSlots: QuizSlotResponseDto[] = [
  {
    id: '51070001-0001-4001-8001-000000000001',
    position: 0,
    kind: 'question',
    mark: 1,
    question: {
      id: QUESTION_ID,
      name: 'Binary search cost',
      text: 'How many comparisons does binary search make?',
      type: 'single_choice',
      version: 2,
    },
    categoryId: null,
    categoryName: null,
    pickCount: null,
  },
  {
    id: '51070001-0001-4001-8001-000000000002',
    position: 1,
    kind: 'random',
    mark: 2,
    question: null,
    categoryId: CATEGORY_ID,
    categoryName: 'Sorting',
    pickCount: 1,
  },
];

export const ATTEMPT_ID = 'a77e0001-0001-4001-8001-000000000001';

const part = (id: number, text: string) => ({ id, text });
const unanswered = { response: null, savedAt: null };

export const quizAttempt: QuizAttemptResponseDto = {
  id: ATTEMPT_ID,
  quizId: QUIZ_ID,
  attempt: 2,
  state: 'in_progress',
  startedAt: '2026-10-24T08:00:00.000Z',
  deadlineAt: '2026-10-24T08:10:00.000Z',
  remainingSeconds: 600,
  finishedAt: null,
  closedBy: null,
  layout: 'one_per_page',
  missingQuestions: 0,
  questions: [
    {
      position: 0,
      type: 'single_choice',
      text: 'How many comparisons does binary search make?',
      mark: 1,
      choices: [part(1, 'Θ(n)'), part(0, 'Θ(log n)')],
      prompts: [],
      answers: [],
      response: { choice: 0, choices: null, value: null, text: null, pairs: null },
      savedAt: '2026-10-24T08:01:00.000Z',
    },
    {
      position: 1,
      type: 'multiple_choice',
      text: 'Which sorts are stable?',
      mark: 2,
      choices: [part(0, 'Merge sort'), part(1, 'Quicksort')],
      prompts: [],
      answers: [],
      ...unanswered,
    },
    {
      position: 2,
      type: 'true_false',
      text: 'Merge sort is stable.',
      mark: 1,
      choices: [],
      prompts: [],
      answers: [],
      ...unanswered,
    },
    {
      position: 3,
      type: 'numerical',
      text: 'Comparisons for 1024 items?',
      mark: 1,
      choices: [],
      prompts: [],
      answers: [],
      ...unanswered,
    },
    {
      position: 4,
      type: 'matching',
      text: 'Match each structure.',
      mark: 2,
      choices: [],
      prompts: [part(0, 'Stack'), part(1, 'Queue')],
      answers: [part(1, 'FIFO'), part(0, 'LIFO')],
      ...unanswered,
    },
    {
      position: 5,
      type: 'essay',
      text: 'Explain Dijkstra.',
      mark: 4,
      choices: [],
      prompts: [],
      answers: [],
      ...unanswered,
    },
  ],
};

export const finishedAttempt: QuizAttemptResponseDto = {
  ...quizAttempt,
  state: 'finished',
  remainingSeconds: null,
  finishedAt: '2026-10-24T08:07:00.000Z',
  closedBy: 'student',
  questions: [],
};

const noKey = {
  choices: null,
  value: null,
  texts: null,
  number: null,
  tolerance: null,
  pairs: null,
};
const noAnswer = { choice: null, choices: null, value: null, text: null, pairs: null };

export const attemptReview: QuizAttemptReviewResponseDto = {
  id: ATTEMPT_ID,
  quizId: QUIZ_ID,
  attempt: 2,
  startedAt: '2026-10-24T08:00:00.000Z',
  finishedAt: '2026-10-24T08:07:00.000Z',
  closedBy: 'student',
  shown: {
    responses: true,
    correctness: true,
    correctAnswer: true,
    feedback: true,
    overallMark: true,
  },
  revealsAt: null,
  score: { rawMarks: 3, maxMarks: 5, points: 6, maxPoints: 10, awaitingMarking: false },
  questions: [
    {
      position: 0,
      type: 'single_choice',
      text: 'How many comparisons does binary search make?',
      mark: 1,
      choices: [part(1, 'Θ(n)'), part(0, 'Θ(log n)')],
      prompts: [],
      answers: [],
      response: { ...noAnswer, choice: 1 },
      outcome: 'wrong',
      awarded: 0,
      key: { ...noKey, choices: [0] },
      generalFeedback: 'It halves the range.',
      specificFeedback: ['That is a scan.'],
      comment: null,
    },
    {
      position: 1,
      type: 'essay',
      text: 'Explain Dijkstra.',
      mark: 4,
      choices: [],
      prompts: [],
      answers: [],
      response: { ...noAnswer, text: 'A settled vertex stays settled.' },
      outcome: 'partial',
      awarded: 3,
      key: null,
      generalFeedback: null,
      specificFeedback: [],
      comment: 'Say why a negative edge breaks it.',
    },
  ],
};

export const attemptForMarking: QuizAttemptMarkingResponseDto = {
  id: ATTEMPT_ID,
  attempt: 2,
  state: 'finished',
  startedAt: '2026-10-24T08:00:00.000Z',
  finishedAt: '2026-10-24T08:07:00.000Z',
  closedBy: 'student',
  student: {
    id: '5e5e5e5e-0001-4001-8001-000000000001',
    displayName: 'Marek Novák',
    email: 'marek.novak0017@mocku.example',
  },
  maxMarks: 5,
  rawMarks: 0,
  points: 0,
  needsMarking: true,
  missingQuestions: 0,
  score: {
    rawMarks: null,
    maxMarks: 5,
    points: null,
    maxPoints: 10,
    awaitingMarking: true,
  },
  questions: [
    {
      ...attemptReview.questions[0]!,
      comment: null,
      autoMark: 0,
      manualMark: null,
      markedAt: null,
    },
    {
      ...attemptReview.questions[1]!,
      outcome: 'needs_marking',
      awarded: null,
      comment: null,
      autoMark: null,
      manualMark: null,
      markedAt: null,
    },
  ],
};

export const regradePreview: QuizRegradeResponseDto = {
  outdatedAttempts: 3,
  incompatible: 1,
  regradedAttempts: 2,
  changedAttempts: 2,
  changedStudents: 2,
  largestRise: 2.5,
  largestFall: 0,
  applied: false,
};

export const questionResults: QuizQuestionResultDto[] = [
  {
    questionId: QUESTION_ID,
    name: 'Binary search cost',
    type: 'single_choice',
    attempts: 4,
    fullyRight: 3,
    awaitingMarking: 0,
    fullyRightPercent: 75,
    averageMark: 0.75,
    averageOutOf: 1,
    distribution: {
      options: [
        { text: 'Θ(log n)', value: null, correct: true, count: 3 },
        { text: 'Θ(n)', value: null, correct: false, count: 1 },
      ],
      unanswered: 0,
    },
  },
];

export const myQuizAttempts: MyQuizAttemptDto[] = [
  {
    id: 'a77e0001-0001-4001-8001-000000000000',
    attempt: 1,
    state: 'finished',
    startedAt: '2026-10-08T07:00:00.000Z',
    finishedAt: '2026-10-08T07:07:00.000Z',
    closedBy: 'student',
    review: {
      available: true,
      score: {
        rawMarks: 5,
        maxMarks: 8,
        points: 6.25,
        maxPoints: 10,
        awaitingMarking: false,
      },
    },
  },
];

export const attemptStanding: QuizAttemptStandingDto = {
  inProgressId: null,
  used: 1,
  maxAttempts: 2,
  blockedBy: null,
};

export const quizAttemptRows: QuizAttemptRowDto[] = [
  {
    id: myQuizAttempts[0]!.id,
    attempt: 1,
    state: 'finished',
    startedAt: myQuizAttempts[0]!.startedAt,
    finishedAt: myQuizAttempts[0]!.finishedAt,
    closedBy: 'student',
    student: {
      id: '5e5e5e5e-0001-4001-8001-000000000001',
      displayName: 'Marek Novák',
      email: 'marek.novak0017@mocku.example',
    },
    maxMarks: 8,
    rawMarks: 5,
    points: 6.25,
    needsMarking: true,
    missingQuestions: 0,
  },
];

export const quizHandlers = [
  http.get(`${SPACE}/quizzes/:quizId/attempts/mine`, () =>
    HttpResponse.json({ ...page(myQuizAttempts), standing: attemptStanding }),
  ),
  http.get(`${SPACE}/quizzes/:quizId/attempts`, () =>
    HttpResponse.json(page(quizAttemptRows)),
  ),
  http.post(`${SPACE}/quizzes/:quizId/attempts`, () => HttpResponse.json(quizAttempt)),
  http.get(`${SPACE}/quizzes/:quizId/attempts/:attemptId/marking`, () =>
    HttpResponse.json(attemptForMarking),
  ),
  http.put(`${SPACE}/quizzes/:quizId/attempts/:attemptId/questions/:position/mark`, () =>
    HttpResponse.json(attemptForMarking),
  ),
  http.get(`${SPACE}/quizzes/:quizId/regrade`, () => HttpResponse.json(regradePreview)),
  http.post(`${SPACE}/quizzes/:quizId/regrade`, () =>
    HttpResponse.json({ ...regradePreview, applied: true }),
  ),
  http.get(`${SPACE}/quizzes/:quizId/results`, () =>
    HttpResponse.json(page(questionResults)),
  ),
  http.get(`${SPACE}/quizzes/:quizId/attempts/:attemptId/review`, () =>
    HttpResponse.json(attemptReview),
  ),
  http.get(`${SPACE}/quizzes/:quizId/attempts/:attemptId`, () =>
    HttpResponse.json(quizAttempt),
  ),
  http.put(
    `${SPACE}/quizzes/:quizId/attempts/:attemptId/answers/:position`,
    async ({ request, params }) => {
      const body = (await request.json()) as SaveQuizAnswerDto;

      return HttpResponse.json({
        position: Number(params['position']),
        answered: true,
        response: {
          choice: null,
          choices: null,
          value: null,
          text: null,
          pairs: null,
          ...body,
        },
        savedAt: '2026-10-24T08:02:00.000Z',
        remainingSeconds: 480,
      });
    },
  ),
  http.post(`${SPACE}/quizzes/:quizId/attempts/:attemptId/submit`, () =>
    HttpResponse.json(finishedAttempt),
  ),
  http.get(`${SPACE}/quizzes`, () => HttpResponse.json(offeringQuizzes)),
  http.get(`${SPACE}/quizzes/:quizId`, () => HttpResponse.json(offeringQuizzes[0])),
  http.post(`${SPACE}/quizzes`, async ({ request }) => {
    const body = (await request.json()) as Partial<QuizResponseDto>;

    return HttpResponse.json(
      { ...offeringQuizzes[0]!, id: 'a0a0a0a0-0001-4001-8001-000000000009', ...body },
      { status: 201 },
    );
  }),
  http.patch(`${SPACE}/quizzes/:quizId`, () => HttpResponse.json(offeringQuizzes[0])),
  http.delete(`${SPACE}/quizzes/:quizId`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${SPACE}/quizzes/:quizId/slots`, () =>
    HttpResponse.json({ ...page(quizSlots), questionCount: 2, totalMarks: 3 }),
  ),
  http.post(`${SPACE}/quizzes/:quizId/slots`, () =>
    HttpResponse.json([quizSlots[0]], { status: 201 }),
  ),
  http.patch(`${SPACE}/quizzes/:quizId/slots/:slotId`, () =>
    HttpResponse.json(quizSlots[0]),
  ),
  http.delete(
    `${SPACE}/quizzes/:quizId/slots/:slotId`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.get(`${SPACE}/question-categories`, ({ request }) => {
    const q = new URL(request.url).searchParams.get('q')?.toLowerCase() ?? '';

    return HttpResponse.json(
      page(
        questionCategories.filter(category => category.name.toLowerCase().includes(q)),
      ),
    );
  }),
  http.post(`${SPACE}/question-categories`, async ({ request }) => {
    const body = (await request.json()) as { name: string };

    return HttpResponse.json(
      { id: 'ca7e0001-0001-4001-8001-000000000009', name: body.name, questionCount: 0 },
      { status: 201 },
    );
  }),
  http.patch(`${SPACE}/question-categories/:categoryId`, async ({ request }) => {
    const body = (await request.json()) as { name: string };

    return HttpResponse.json({ ...questionCategories[0]!, name: body.name });
  }),
  http.delete(
    `${SPACE}/question-categories/:categoryId`,
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.get(`${SPACE}/questions`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const type = params.get('type');

    return HttpResponse.json(
      page(bankQuestions.filter(question => type === null || question.type === type)),
    );
  }),
  http.get(`${SPACE}/questions/:questionId`, () => HttpResponse.json(bankQuestion)),
  http.post(`${SPACE}/questions`, async ({ request }) => {
    const body = (await request.json()) as Partial<QuestionResponseDto>;

    return HttpResponse.json({ ...bankQuestion, ...body, version: 1 }, { status: 201 });
  }),
  http.put(`${SPACE}/questions/:questionId`, async ({ request }) => {
    const body = (await request.json()) as Partial<QuestionResponseDto>;

    return HttpResponse.json({ ...bankQuestion, ...body, version: 3 });
  }),
  http.delete(
    `${SPACE}/questions/:questionId`,
    () => new HttpResponse(null, { status: 204 }),
  ),
];
