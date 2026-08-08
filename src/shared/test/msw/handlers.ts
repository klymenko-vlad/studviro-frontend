import { http, HttpResponse } from 'msw';

import type { AuthTokensDto, ErrorResponseDto, UserResponseDto } from '@/shared/api';

/**
 * The browser talks to the same-origin BFF, not to the API — so that is what
 * the handlers intercept. `location.origin` under jsdom is what the client's
 * relative `/api/proxy` and `/api/auth` URLs resolve against.
 */
const PROXY = '/api/proxy/api/v1';
const BFF = '/api/auth';

/**
 * Default handlers for the happy path. Everything is typed against the generated
 * DTOs, so a backend contract change that breaks the app also breaks these mocks
 * at compile time — mocks drifting from reality is the usual way a green test
 * suite stops meaning anything.
 *
 * Override per test with `server.use(...)` rather than editing this file.
 */
export const users: UserResponseDto[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'ada@example.com',
    displayName: 'Ada Lovelace',
    locale: 'en',
    role: 'user',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'alan@example.com',
    displayName: 'Alan Turing',
    locale: 'uk',
    role: 'admin',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

export const session: AuthTokensDto = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresIn: 900,
  tokenType: 'Bearer',
  user: users[0]!,
};

export function errorResponse(
  status: number,
  message: string | string[],
  error = 'Error',
): ErrorResponseDto {
  return {
    statusCode: status,
    error,
    message,
    path: '/api/v1/users',
    requestId: 'test-request-id',
    timestamp: '2026-01-01T00:00:00.000Z',
  };
}

export const handlers = [
  /**
   * The BFF returns only the user; the tokens stay in httpOnly cookies the test
   * environment never sees. A handler that returned them would let a component
   * test pass while the real client had no way to read one.
   */
  http.post(`${BFF}/login`, () => HttpResponse.json({ user: session.user })),
  http.post(`${BFF}/register`, () => HttpResponse.json({ user: session.user })),
  http.post(`${BFF}/refresh`, () => HttpResponse.json({ user: session.user })),
  http.post(`${BFF}/logout`, () => new HttpResponse(null, { status: 204 })),

  http.get(`${PROXY}/auth/me`, () => HttpResponse.json(session.user)),
  http.get(`${PROXY}/users/me`, () => HttpResponse.json(session.user)),

  http.patch(`${PROXY}/users/me`, async ({ request }) => {
    const body = (await request.json()) as Partial<UserResponseDto>;

    return HttpResponse.json({ ...session.user, ...body } satisfies UserResponseDto);
  }),

  http.get(`${PROXY}/users`, () =>
    HttpResponse.json({
      items: users,
      meta: {
        page: 1,
        limit: 20,
        total: users.length,
        pageCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
  ),

  http.post(`${PROXY}/users`, async ({ request }) => {
    const body = (await request.json()) as { email: string; displayName: string };

    return HttpResponse.json(
      {
        id: '33333333-3333-4333-8333-333333333333',
        email: body.email,
        displayName: body.displayName,
        locale: 'en',
        role: 'user',
        createdAt: '2026-01-03T00:00:00.000Z',
      } satisfies UserResponseDto,
      { status: 201 },
    );
  }),

  http.get(`${PROXY}/users/:id`, ({ params }) => {
    const user = users.find(candidate => candidate.id === params['id']);
    if (!user) {
      return HttpResponse.json(errorResponse(404, 'User not found', 'Not Found'), {
        status: 404,
      });
    }
    return HttpResponse.json(user);
  }),

  http.delete(`${PROXY}/users/:id`, () => new HttpResponse(null, { status: 204 })),
];
