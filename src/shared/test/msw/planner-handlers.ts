import { http, HttpResponse } from 'msw';

import type { PersonalEventDto, PersonalTaskDto } from '@/shared/api';

const ME = '/api/proxy/api/v1/institutions/:institutionId/me';

export const PERSONAL_TASK_ID = '7a5c0001-0001-4001-8001-000000000001';
export const PERSONAL_EVENT_ID = '7a5c0002-0002-4002-8002-000000000002';

export const personalTasks: PersonalTaskDto[] = [
  {
    id: PERSONAL_TASK_ID,
    title: 'Pay the dorm fee',
    note: 'Variable symbol on the invoice',
    dueAt: '2026-06-03T16:00:00.000Z',
    done: false,
    completedAt: null,
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: '7a5c0001-0001-4001-8001-000000000002',
    title: 'Return library books',
    note: null,
    dueAt: null,
    done: false,
    completedAt: null,
    createdAt: '2026-05-21T08:00:00.000Z',
    updatedAt: '2026-05-21T08:00:00.000Z',
  },
];

export const personalEvents: PersonalEventDto[] = [
  {
    id: PERSONAL_EVENT_ID,
    title: 'Volleyball training',
    note: null,
    location: 'Sports hall',
    startsAt: '2026-06-02T16:00:00.000Z',
    endsAt: '2026-06-02T18:00:00.000Z',
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
];

const inRange = (at: string, query: URLSearchParams) => {
  const from = query.get('from');
  const to = query.get('to');
  const time = Date.parse(at);

  return (
    (from === null || time >= Date.parse(from)) && (to === null || time < Date.parse(to))
  );
};

export const plannerHandlers = [
  http.get(`${ME}/tasks/due`, ({ request }) => {
    const query = new URL(request.url, location.origin).searchParams;

    return HttpResponse.json(
      personalTasks.filter(
        task => !task.done && task.dueAt !== null && inRange(task.dueAt, query),
      ),
    );
  }),

  http.get(`${ME}/tasks`, ({ request }) => {
    const query = new URL(request.url, location.origin).searchParams;
    const status = query.get('status') ?? 'open';
    const q = query.get('q')?.toLowerCase() ?? '';
    const items = personalTasks.filter(
      task =>
        (status === 'all' || (status === 'done') === task.done) &&
        (q === '' || task.title.toLowerCase().includes(q)),
    );

    return HttpResponse.json({
      items,
      meta: { limit: 20, hasNextPage: false, nextCursor: null },
    });
  }),

  http.post(`${ME}/tasks`, async ({ request }) => {
    const body = (await request.json()) as Partial<PersonalTaskDto>;

    return HttpResponse.json(
      {
        ...personalTasks[0],
        id: '7a5c0001-0001-4001-8001-000000000009',
        title: body.title ?? '',
        note: body.note ?? null,
        dueAt: body.dueAt ?? null,
      },
      { status: 201 },
    );
  }),

  http.patch(`${ME}/tasks/:taskId`, async ({ request, params }) => {
    const body = (await request.json()) as Partial<PersonalTaskDto>;
    const task =
      personalTasks.find(item => item.id === params['taskId']) ?? personalTasks[0];

    return HttpResponse.json({
      ...task,
      ...body,
      completedAt: body.done === true ? '2026-06-01T08:00:00.000Z' : null,
    });
  }),

  http.delete(`${ME}/tasks/:taskId`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${ME}/personal-events`, ({ request }) => {
    const query = new URL(request.url, location.origin).searchParams;

    return HttpResponse.json(
      personalEvents.filter(event => inRange(event.startsAt, query)),
    );
  }),

  http.post(`${ME}/personal-events`, async ({ request }) => {
    const body = (await request.json()) as Partial<PersonalEventDto>;

    return HttpResponse.json({ ...personalEvents[0], ...body }, { status: 201 });
  }),

  http.patch(`${ME}/personal-events/:eventId`, async ({ request }) => {
    const body = (await request.json()) as Partial<PersonalEventDto>;

    return HttpResponse.json({ ...personalEvents[0], ...body });
  }),

  http.delete(
    `${ME}/personal-events/:eventId`,
    () => new HttpResponse(null, { status: 204 }),
  ),
];
