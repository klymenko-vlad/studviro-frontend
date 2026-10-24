import { http, HttpResponse } from 'msw';

import type {
  QuestionCategoryResponseDto,
  QuestionResponseDto,
  QuestionSummaryDto,
  QuizResponseDto,
  QuizSlotResponseDto,
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

export const quizHandlers = [
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
