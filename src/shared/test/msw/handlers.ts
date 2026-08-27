import { http, HttpResponse } from 'msw';

import type {
  AuthTokensDto,
  ConnectorStatusResponseDto,
  ErrorResponseDto,
  ExternalIdentityResponseDto,
  InstitutionConfigurationResponseDto,
  InstitutionResponseDto,
  MyCourseResponseDto,
  MyPermissionsResponseDto,
  RoleAssignmentResponseDto,
  UserResponseDto,
} from '@/shared/api';

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

export const roleAssignments: RoleAssignmentResponseDto[] = [
  {
    id: '44444444-4444-4444-8444-444444444444',
    institutionId: '55555555-5555-4555-8555-555555555555',
    userId: users[0]!.id,
    role: 'student',
    scopeType: 'institution',
    scopeId: null,
    validFrom: null,
    validUntil: null,
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    institutionId: '55555555-5555-4555-8555-555555555555',
    userId: users[0]!.id,
    role: 'teaching_assistant',
    scopeType: 'course_offering',
    scopeId: '77777777-7777-4777-8777-777777777777',
    validFrom: null,
    validUntil: '2027-01-31T00:00:00.000Z',
  },
];

export const institutions: InstitutionResponseDto[] = [
  {
    id: '55555555-5555-4555-8555-555555555555',
    code: 'upjs',
    name: 'Pavol Jozef Šafárik University',
    defaultLocale: 'en',
    timezone: 'Europe/Bratislava',
  },
];

export const institutionConfiguration: InstitutionConfigurationResponseDto = {
  institutionId: '55555555-5555-4555-8555-555555555555',
  code: 'upjs',
  name: 'Pavol Jozef \u0160af\u00e1rik University',
  defaultLocale: 'en',
  timezone: 'Europe/Bratislava',
  terminology: {
    institution: null,
    faculty: 'School',
    department: null,
    program: null,
    course: null,
    courseOffering: null,
    academicTerm: null,
    student: null,
    teacher: null,
    studentIdentifier: null,
    credits: null,
  },
  features: {
    courseRegistration: true,
    examRegistration: true,
    timetable: true,
    grades: true,
    thesis: false,
    accommodation: false,
    fees: false,
  },
  connectors: { academicSystem: 'mock-sis', learningSystem: null },
};

export const connectorStatuses: ConnectorStatusResponseDto[] = [
  {
    kind: 'academic',
    name: 'mock-sis',
    installed: true,
    healthy: true,
    checkedAt: '2026-08-15T09:00:00.000Z',
    detail: null,
    capabilities: ['courses.read', 'enrollments.read'],
    alternatives: ['mock-sis'],
  },
  {
    kind: 'learning',
    name: null,
    installed: false,
    healthy: false,
    checkedAt: null,
    detail: null,
    capabilities: [],
    alternatives: [],
  },
];

export const permissions: MyPermissionsResponseDto = {
  institutionId: '55555555-5555-4555-8555-555555555555',
  roles: ['institution_admin'],
  permissions: [
    'institution:read',
    'institution:manage',
    'role:read',
    'role:assign',
    'enrollment:read',
  ],
};

export const linkedAccounts: ExternalIdentityResponseDto[] = [
  {
    id: '88888888-8888-4888-8888-888888888888',
    institutionId: '55555555-5555-4555-8555-555555555555',
    sourceSystem: 'sis',
    issuer: 'https://login.upjs.sk',
    externalUsername: 'ada123',
    lastAuthenticatedAt: '2026-08-01T09:00:00.000Z',
  },
];

export const enrolledCourses: MyCourseResponseDto[] = [
  {
    enrollmentId: '99999999-9999-4999-8999-999999999991',
    status: 'active',
    requirementType: 'compulsory',
    attempt: 1,
    enrolledAt: '2026-02-10T00:00:00.000Z',
    offering: {
      id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      status: 'running',
      language: 'sk',
      capacity: 120,
    },
    course: {
      id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      code: 'INF/ALG/22',
      title: 'Algorithms',
      description: null,
      credits: 6,
    },
    term: {
      id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
      code: '2026-SS',
      name: 'Summer 2026',
      academicYear: '2025/2026',
      startsAt: '2026-02-01T00:00:00.000Z',
      endsAt: '2026-06-30T00:00:00.000Z',
    },
    teachers: [
      {
        userId: '11111111-1111-4111-8111-111111111111',
        displayName: 'Ada Lovelace',
        role: 'lecturer',
        isPrimary: true,
      },
    ],
  },
  {
    enrollmentId: '99999999-9999-4999-8999-999999999992',
    status: 'completed',
    requirementType: 'elective',
    attempt: 2,
    enrolledAt: '2025-09-15T00:00:00.000Z',
    offering: {
      id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      status: 'closed',
      language: null,
      capacity: null,
    },
    course: {
      id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      code: 'INF/DB/22',
      title: 'Databases',
      description: null,
      credits: 5,
    },
    term: {
      id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc2',
      code: '2025-WS',
      name: 'Winter 2025',
      academicYear: '2025/2026',
      startsAt: '2025-09-01T00:00:00.000Z',
      endsAt: '2026-01-31T00:00:00.000Z',
    },
    teachers: [],
  },
];

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

  http.get(`${PROXY}/users/me/roles`, () => HttpResponse.json(roleAssignments)),
  http.get(`${PROXY}/users/me/identities`, () => HttpResponse.json(linkedAccounts)),

  http.get(`${PROXY}/institutions`, () => HttpResponse.json(institutions)),

  http.get(`${PROXY}/institutions/:institutionId`, ({ params }) => {
    const institution = institutions.find(
      candidate => candidate.id === params['institutionId'],
    );
    if (!institution) {
      return HttpResponse.json(errorResponse(404, 'Institution not found', 'Not Found'), {
        status: 404,
      });
    }

    return HttpResponse.json(institution);
  }),

  http.get(`${PROXY}/institutions/:institutionId/me/permissions`, ({ params }) =>
    HttpResponse.json({
      ...permissions,
      institutionId: params['institutionId'] as string,
    } satisfies MyPermissionsResponseDto),
  ),

  http.get(`${PROXY}/institutions/:institutionId/me/courses`, () =>
    HttpResponse.json(enrolledCourses),
  ),

  http.get(`${PROXY}/institutions/:institutionId/configuration`, ({ params }) =>
    HttpResponse.json({
      ...institutionConfiguration,
      institutionId: params['institutionId'] as string,
    } satisfies InstitutionConfigurationResponseDto),
  ),

  http.patch(
    `${PROXY}/institutions/:institutionId/configuration`,
    async ({ request }) => {
      const body = (await request.json()) as Partial<InstitutionConfigurationResponseDto>;

      return HttpResponse.json({
        ...institutionConfiguration,
        ...body,
        terminology: { ...institutionConfiguration.terminology, ...body.terminology },
        features: { ...institutionConfiguration.features, ...body.features },
      } satisfies InstitutionConfigurationResponseDto);
    },
  ),

  http.get(`${PROXY}/institutions/:institutionId/connectors`, () =>
    HttpResponse.json(connectorStatuses),
  ),

  http.get(`${PROXY}/institutions/:institutionId/role-assignments`, () =>
    HttpResponse.json(roleAssignments),
  ),

  http.post(
    `${PROXY}/institutions/:institutionId/role-assignments`,
    async ({ request }) => {
      const body = (await request.json()) as Omit<
        RoleAssignmentResponseDto,
        'id' | 'institutionId' | 'validFrom' | 'validUntil'
      >;

      return HttpResponse.json(
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          institutionId: institutions[0]!.id,
          validFrom: null,
          validUntil: null,
          scopeId: null,
          ...body,
        } satisfies RoleAssignmentResponseDto,
        { status: 201 },
      );
    },
  ),

  http.delete(
    `${PROXY}/institutions/:institutionId/role-assignments/:id`,
    () => new HttpResponse(null, { status: 204 }),
  ),
];
