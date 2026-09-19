import { http, HttpResponse } from 'msw';

import type {
  AcademicTermResponseDto,
  AuthTokensDto,
  CourseOfferingListItemDto,
  CourseOfferingResponseDto,
  CourseResponseDto,
  CourseRosterResponseDto,
  EnrollableOfferingResponseDto,
  ErrorResponseDto,
  ExternalIdentityResponseDto,
  InstitutionConfigurationResponseDto,
  InstitutionResponseDto,
  LearningSpaceListResponseDto,
  MyAssessmentResultResponseDto,
  MyCourseResponseDto,
  MyCourseResultResponseDto,
  MyDeadlineResponseDto,
  MyExamTermResponseDto,
  MyPermissionsResponseDto,
  MyTimetableEventResponseDto,
  NotificationResponseDto,
  OfferingResultsResponseDto,
  PersonDirectoryEntryDto,
  ProgramResponseDto,
  RoleAssignmentResponseDto,
  RoomResponseDto,
  StudyProgressResponseDto,
  TeachingAssignmentResponseDto,
  TeachingOfferingResponseDto,
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
    locale: 'sk',
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
    source: 'derived',
    revocable: false,
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    institutionId: '55555555-5555-4555-8555-555555555555',
    userId: users[0]!.id,
    role: 'registrar',
    scopeType: 'course_offering',
    scopeId: '77777777-7777-4777-8777-777777777777',
    validFrom: null,
    validUntil: '2027-01-31T00:00:00.000Z',
    source: 'granted',
    revocable: true,
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
  implementedFeatures: ['examRegistration', 'timetable', 'grades'],
  features: {
    courseRegistration: true,
    examRegistration: true,
    timetable: true,
    grades: true,
    thesis: false,
    accommodation: false,
    fees: false,
  },
};

export const permissions: MyPermissionsResponseDto = {
  institutionId: '55555555-5555-4555-8555-555555555555',
  roles: ['institution_admin'],
  permissions: [
    'institution:read',
    'institution:manage',
    'role:read',
    'role:assign',
    'enrollment:read',
    'offering:read',
    'offering:manage',
    'course:enroll',
    'course:read',
    'course:manage',
    'program:read',
    'program:manage',
    'grade:read',
    'grade:propose',
    'schedule:read',
    'schedule:manage',
    'notification:read',
  ],
};

export const linkedAccounts: ExternalIdentityResponseDto[] = [
  {
    id: '88888888-8888-4888-8888-888888888888',
    institutionId: '55555555-5555-4555-8555-555555555555',
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

export const courseResults: MyCourseResultResponseDto[] = [
  {
    id: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
    status: 'official',
    attempt: 1,
    conflictNote: null,
    effective: { kind: 'official', grade: 'A', passed: true },
    isVoided: false,
    calculated: { grade: 'B', points: 87.5 },
    proposed: { grade: 'B', at: '2026-06-01T00:00:00.000Z' },
    official: { grade: 'A', recordedAt: '2026-06-10T00:00:00.000Z' },
    enrollmentId: '99999999-9999-4999-8999-999999999991',
    offering: { id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1' },
    course: {
      id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      code: 'INF/ALG/22',
      title: 'Algorithms',
      credits: 6,
    },
    term: {
      id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
      code: '2026-SS',
      name: 'Summer 2026',
      academicYear: '2025/2026',
      startsAt: '2026-02-01T00:00:00.000Z',
    },
  },
  {
    id: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd2',
    status: 'proposed',
    attempt: 2,
    conflictNote: 'The source system reports a different mark.',
    effective: { kind: 'proposed', grade: 'C', passed: true },
    isVoided: false,
    calculated: { grade: 'D', points: 61 },
    proposed: { grade: 'C', at: '2026-01-20T00:00:00.000Z' },
    official: { grade: null, recordedAt: null },
    enrollmentId: '99999999-9999-4999-8999-999999999992',
    offering: { id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa2' },
    course: {
      id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      code: 'INF/DB/22',
      title: 'Databases',
      credits: 5,
    },
    term: {
      id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc2',
      code: '2025-WS',
      name: 'Winter 2025',
      academicYear: '2025/2026',
      startsAt: '2025-09-01T00:00:00.000Z',
    },
  },
];

/**
 * Built from local components rather than fixed UTC instants: the calendar
 * groups events by the day they fall on in the reader's own timezone, and a
 * `Z` literal would land on a different day in half of them.
 */
const localIso = (year: number, month: number, day: number, hour: number): string =>
  new Date(year, month - 1, day, hour).toISOString();

export const notifications: NotificationResponseDto[] = [
  {
    id: 'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1',
    type: 'exam_term_rescheduled',
    occurredAt: localIso(2026, 5, 18, 9),
    occurrenceCount: 2,
    readAt: null,
    examTermId: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
    courseOfferingId: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    courseCode: 'INF/ALG/22',
    courseTitle: 'Algorithms',
    startsAt: localIso(2026, 6, 4, 9),
    previousStartsAt: localIso(2026, 6, 2, 9),
    learningActivityId: null,
    dueAt: null,
    previousDueAt: null,
    activityName: null,
    grade: null,
    previousGrade: null,
    attempt: null,
    eventTitle: null,
    reason: null,
  },
  {
    id: 'eeeeeee2-eeee-4eee-8eee-eeeeeeeeeee2',
    type: 'exam_term_published',
    occurredAt: localIso(2026, 5, 17, 9),
    occurrenceCount: 1,
    readAt: localIso(2026, 5, 17, 12),
    examTermId: 'ddddddd2-dddd-4ddd-8ddd-ddddddddddd2',
    courseOfferingId: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    courseCode: 'INF/DB/22',
    courseTitle: 'Databases',
    startsAt: localIso(2026, 6, 10, 9),
    previousStartsAt: null,
    learningActivityId: null,
    dueAt: null,
    previousDueAt: null,
    activityName: null,
    grade: null,
    previousGrade: null,
    attempt: null,
    eventTitle: null,
    reason: null,
  },
  {
    id: 'eeeeeee3-eeee-4eee-8eee-eeeeeeeeeee3',
    type: 'assignment_due_published',
    occurredAt: localIso(2026, 2, 28, 9),
    occurrenceCount: 1,
    readAt: localIso(2026, 2, 28, 12),
    examTermId: null,
    courseOfferingId: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    courseCode: 'INF/DB/22',
    courseTitle: 'Databases',
    startsAt: null,
    previousStartsAt: null,
    learningActivityId: 'aaaaaaad-aaaa-4aaa-8aaa-aaaaaaaaaaae',
    dueAt: localIso(2026, 3, 5, 21),
    previousDueAt: null,
    activityName: 'Assignment 1',
    grade: null,
    previousGrade: null,
    attempt: null,
    eventTitle: null,
    reason: null,
  },
];

export const assessmentResults: MyAssessmentResultResponseDto[] = [
  {
    id: 'aaaaaab1-aaaa-4aaa-8aaa-aaaaaaaaaab1',
    name: 'Assignment 1',
    points: 72,
    maxPoints: 100,
    percentage: 72,
    feedback: null,
    gradedAt: localIso(2026, 3, 10, 12),
    countsTowardFinalGrade: true,
    activity: {
      id: 'aaaaaaad-aaaa-4aaa-8aaa-aaaaaaaaaaae',
      type: 'assignment',
      url: 'https://lms.example/mod/assign/view.php?id=1',
      dueAt: localIso(2026, 3, 5, 21),
      completionState: 'complete',
      submission: {
        state: 'graded',
        submittedAt: localIso(2026, 3, 5, 18),
        isLate: false,
      },
    },
    learningSpace: {
      id: 'aaaaaaaf-aaaa-4aaa-8aaa-aaaaaaaaaaaf',
      name: 'Databases',
    },
    offering: { id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2' },
  },
  {
    id: 'aaaaaab2-aaaa-4aaa-8aaa-aaaaaaaaaab2',
    name: 'Quiz 2',
    points: null,
    maxPoints: 100,
    percentage: null,
    feedback: null,
    gradedAt: null,
    countsTowardFinalGrade: false,
    activity: null,
    learningSpace: {
      id: 'aaaaaaaf-aaaa-4aaa-8aaa-aaaaaaaaaaaf',
      name: 'Databases',
    },
    offering: { id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2' },
  },
];

export const deadlines: MyDeadlineResponseDto[] = [
  {
    id: 'aaaaaaad-aaaa-4aaa-8aaa-aaaaaaaaaaae',
    type: 'assignment',
    name: 'Assignment 1',
    url: 'https://lms.example/mod/assign/view.php?id=1',
    opensAt: localIso(2026, 2, 26, 9),
    dueAt: localIso(2026, 3, 5, 21),
    isOpen: true,
    isOverdue: false,
    submission: null,
    attendance: 'enrolled',
    learningSpace: {
      id: 'aaaaaaaf-aaaa-4aaa-8aaa-aaaaaaaaaaaf',
      name: 'Databases',
      url: 'https://lms.example/course/view.php?id=2',
    },
    offering: { id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2' },
    course: {
      id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      code: 'INF/DB/22',
      title: 'Databases',
    },
    term: {
      id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
      code: '2026-SS',
      name: 'Summer 2026',
    },
  },
];

function startsInRange(startsAt: string, query: URLSearchParams): boolean {
  const from = query.get('from');
  const to = query.get('to');

  const at = Date.parse(startsAt);

  return (
    (from === null || at >= Date.parse(from)) && (to === null || at < Date.parse(to))
  );
}

export const examTerms: MyExamTermResponseDto[] = [
  {
    id: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
    kind: 'regular',
    startsAt: localIso(2026, 6, 2, 9),
    endsAt: localIso(2026, 6, 2, 12),
    cancelledAt: null,
    isCancelled: false,
    attendance: 'enrolled',
    capacity: 30,
    registeredCount: 12,
    seatsRemaining: 18,
    isFull: false,
    registrationOpensAt: localIso(2026, 5, 12, 9),
    registrationClosesAt: localIso(2026, 5, 31, 9),
    registrationState: 'open',
    registrationAvailability: {
      canRegister: true,
      canCancel: false,
      reason: 'open',
    },
    myRegistration: null,
    room: {
      id: 'fffffff1-ffff-4fff-8fff-fffffffffff1',
      code: 'P1',
      name: 'Lecture hall',
      building: 'Jesenn\u00e1 5',
    },
    examiner: {
      id: '22222222-2222-4222-8222-222222222222',
      displayName: 'Alan Turing',
    },
    offering: { id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1' },
    course: {
      id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      code: 'INF/ALG/22',
      title: 'Algorithms',
    },
    term: {
      id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
      code: '2026-SS',
      name: 'Summer 2026',
    },
  },
  {
    id: 'ddddddd2-dddd-4ddd-8ddd-ddddddddddd2',
    kind: 'first_retake',
    startsAt: localIso(2026, 6, 23, 9),
    endsAt: null,
    cancelledAt: null,
    isCancelled: false,
    attendance: 'enrolled',
    capacity: 20,
    registeredCount: 20,
    seatsRemaining: 0,
    isFull: true,
    registrationOpensAt: localIso(2026, 6, 10, 9),
    registrationClosesAt: null,
    registrationState: 'not_open',
    registrationAvailability: {
      canRegister: false,
      canCancel: true,
      reason: 'registered',
    },
    myRegistration: {
      id: 'ddddddd3-dddd-4ddd-8ddd-ddddddddddd3',
      status: 'registered',
      registeredAt: localIso(2026, 5, 14, 8),
      cancelledAt: null,
    },
    room: null,
    examiner: null,
    offering: { id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1' },
    course: {
      id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      code: 'INF/ALG/22',
      title: 'Algorithms',
    },
    term: {
      id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
      code: '2026-SS',
      name: 'Summer 2026',
    },
  },
  {
    id: 'ddddddd4-dddd-4ddd-8ddd-ddddddddddd4',
    kind: 'regular',
    startsAt: localIso(2026, 1, 20, 9),
    endsAt: localIso(2026, 1, 20, 12),
    cancelledAt: localIso(2026, 1, 10, 9),
    isCancelled: true,
    attendance: 'teaching',
    capacity: null,
    registeredCount: 0,
    seatsRemaining: null,
    isFull: false,
    registrationOpensAt: null,
    registrationClosesAt: null,
    registrationState: 'closed',
    registrationAvailability: {
      canRegister: false,
      canCancel: false,
      reason: 'teaching',
    },
    myRegistration: null,
    room: null,
    examiner: null,
    offering: { id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2' },
    course: {
      id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      code: 'INF/DB/22',
      title: 'Databases',
    },
    term: {
      id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
      code: '2026-SS',
      name: 'Summer 2026',
    },
  },
];

export const timetableEvents: MyTimetableEventResponseDto[] = [
  {
    id: 'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1',
    type: 'lecture',
    title: null,
    startsAt: localIso(2026, 3, 2, 8),
    endsAt: localIso(2026, 3, 2, 10),
    cancelledAt: null,
    isCancelled: false,
    attendance: 'enrolled',
    room: {
      id: 'fffffff1-ffff-4fff-8fff-fffffffffff1',
      code: 'P1',
      name: 'Lecture hall',
      building: 'Jesenn\u00e1 5',
    },
    studyGroup: null,
    offering: { id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1' },
    course: {
      id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      code: 'INF/ALG/22',
      title: 'Algorithms',
    },
    term: {
      id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
      code: '2026-SS',
      name: 'Summer 2026',
    },
  },
  {
    id: 'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee2',
    type: 'seminar',
    title: 'Algorithms seminar',
    startsAt: localIso(2026, 3, 4, 13),
    endsAt: localIso(2026, 3, 4, 15),
    cancelledAt: localIso(2026, 3, 1, 9),
    isCancelled: true,
    attendance: 'teaching',
    room: null,
    studyGroup: {
      id: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
      code: 'S1',
      name: 'Monday seminar',
      kind: 'seminar',
    },
    offering: { id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1' },
    course: {
      id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      code: 'INF/ALG/22',
      title: 'Algorithms',
    },
    term: {
      id: 'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
      code: '2026-SS',
      name: 'Summer 2026',
    },
  },
];

export const courseOffering: CourseOfferingResponseDto = {
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
    description: 'Complexity, design techniques and their analysis.',
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
    {
      userId: '11111111-1111-4111-8111-111111111112',
      displayName: 'Grace Hopper',
      role: 'assistant',
      isPrimary: false,
    },
  ],
  enrollment: {
    enrollmentId: '99999999-9999-4999-8999-999999999991',
    status: 'active',
    requirementType: 'compulsory',
    attempt: 1,
    enrolledAt: '2026-02-10T00:00:00.000Z',
  },
  studyGroups: [
    {
      id: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
      kind: 'seminar',
      code: 'S1',
      name: 'Monday seminar',
      capacity: 20,
    },
  ],
  viewerRole: 'student',
};

export const teachingOfferings: TeachingOfferingResponseDto[] = [
  {
    assignmentId: 'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1',
    role: 'lecturer',
    isPrimary: true,
    enrolledCount: 42,
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
  },
  {
    assignmentId: 'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee2',
    role: 'assistant',
    isPrimary: false,
    enrolledCount: 0,
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
  },
];

export const courseRoster: CourseRosterResponseDto = {
  offering: { id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', capacity: 120 },
  course: {
    id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    code: 'INF/ALG/22',
    title: 'Algorithms',
    credits: 6,
  },
  viewerRole: 'teacher',
  students: [
    {
      enrollmentId: '99999999-9999-4999-8999-999999999991',
      userId: '11111111-1111-4111-8111-111111111111',
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      status: 'active',
      requirementType: 'compulsory',
      attempt: 1,
      enrolledAt: '2026-02-10T00:00:00.000Z',
      studyGroups: [
        {
          id: 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
          kind: 'seminar',
          code: 'S1',
          name: 'Monday seminar',
        },
      ],
    },
    {
      enrollmentId: '99999999-9999-4999-8999-999999999993',
      userId: '11111111-1111-4111-8111-111111111112',
      displayName: 'Grace Hopper',
      email: 'grace@example.com',
      // The roster never returns a withdrawn student; a second attempt is what an
      // `attempt: 2` row actually looks like.
      status: 'completed',
      requirementType: 'elective',
      attempt: 2,
      enrolledAt: '2026-02-11T00:00:00.000Z',
      studyGroups: [],
    },
  ],
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

export const learningSpaces: LearningSpaceListResponseDto = {
  total: 2,
  linked: 1,
  unlinked: 1,
  spaces: [
    {
      id: '9a1f0b3c-1111-4111-8111-111111111111',
      name: 'Algorithms and Data Structures',
      shortName: 'ALG/WS26',
      url: 'https://moodle.mocku.example/course/view.php?idnumber=LMS-ALG',
      visible: true,
      offeringId: '9a1f0b3c-2222-4222-8222-222222222222',
      courseCode: 'ALG',
      courseTitle: 'Algorithms and Data Structures',
      termCode: 'WS26',
      activityCount: 4,
      nextDueAt: '2026-06-15T21:00:00.000Z',
    },
    {
      id: '9a1f0b3c-3333-4333-8333-333333333333',
      name: 'Orphaned Moodle course',
      shortName: null,
      url: null,
      visible: false,
      offeringId: null,
      courseCode: null,
      courseTitle: null,
      termCode: null,
      activityCount: 0,
      nextDueAt: null,
    },
  ],
};

export const people: PersonDirectoryEntryDto[] = [
  {
    userId: '11111111-1111-4111-8111-111111111111',
    email: 'jana.novakova@example.com',
    displayName: 'Jana Nováková',
    status: 'active',
    roles: [],
  },
  {
    userId: '22222222-2222-4222-8222-222222222222',
    email: 'peter.kovac@example.com',
    displayName: 'Peter Kováč',
    status: 'active',
    roles: [],
  },
];

export const teachingAssignments: TeachingAssignmentResponseDto[] = [
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    userId: '11111111-1111-4111-8111-111111111111',
    displayName: 'Jana Nováková',
    email: 'jana.novakova@example.com',
    role: 'lecturer',
    isPrimary: true,
  },
];

export const adminOfferings: CourseOfferingListItemDto[] = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    courseId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
    courseCode: 'INF/ALG/22',
    courseTitle: 'Algorithms',
    academicTermId: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    termCode: '2026W',
    termName: 'Winter semester 2026/2027',
    status: 'open',
    capacity: 60,
    enrolled: 60,
    language: 'sk',
    teacherCount: 2,
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    courseId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
    courseCode: 'INF/DB/22',
    courseTitle: 'Databases',
    academicTermId: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    termCode: '2026W',
    termName: 'Winter semester 2026/2027',
    status: 'planned',
    capacity: null,
    enrolled: 0,
    language: null,
    teacherCount: 0,
  },
];

export const rooms: RoomResponseDto[] = [
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    code: 'FEI-101',
    name: 'Lecture hall',
    building: 'Blok A',
    capacity: 120,
    orgUnitId: null,
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
    code: 'FEI-202',
    name: null,
    building: null,
    capacity: null,
    orgUnitId: null,
  },
];

export const academicTerms: AcademicTermResponseDto[] = [
  {
    id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    code: '2026W',
    name: 'Winter semester 2026/2027',
    kind: 'semester',
    academicYear: '2026/2027',
    startsAt: '2026-09-21T00:00:00.000Z',
    endsAt: '2027-02-14T00:00:00.000Z',
    enrollmentOpensAt: '2026-08-24T00:00:00.000Z',
    enrollmentClosesAt: '2026-10-05T00:00:00.000Z',
  },
  {
    id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
    code: '2026S',
    name: 'Summer semester 2026/2027',
    kind: 'summer',
    academicYear: '2026/2027',
    startsAt: '2027-02-15T00:00:00.000Z',
    endsAt: '2027-07-11T00:00:00.000Z',
    enrollmentOpensAt: null,
    enrollmentClosesAt: null,
  },
];

export const programs: ProgramResponseDto[] = [
  {
    id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    code: 'INF-BC',
    name: 'Informatics',
    degreeLevel: 'bachelor',
    studyForm: 'full_time',
    standardLengthSemesters: 6,
    orgUnitId: null,
  },
];

export const catalogueCourses: CourseResponseDto[] = [
  {
    id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
    code: 'INF/ALG/22',
    title: 'Algorithms',
    description: null,
    credits: 6,
    orgUnitId: null,
  },
];

export const enrollableOfferings: EnrollableOfferingResponseDto[] = [
  {
    id: '66666666-6666-4666-8666-666666666666',
    capacity: 30,
    occupiedSeats: 12,
    seatsRemaining: 18,
    isFull: false,
    enrollmentOpensAt: '2026-01-10T00:00:00.000Z',
    enrollmentClosesAt: '2099-02-10T00:00:00.000Z',
    windowState: 'open',
    availability: { canEnroll: true, canWithdraw: false, reason: 'open' },
    myEnrollment: null,
    course: {
      id: '77777777-7777-4777-8777-777777777777',
      code: 'INF/ALG/22',
      title: 'Algorithms',
      credits: 6,
    },
    term: {
      id: '88888888-8888-4888-8888-888888888888',
      code: '2026-SS',
      name: 'Summer 2026',
    },
  },
  {
    id: '99999999-9999-4999-8999-999999999999',
    capacity: 10,
    occupiedSeats: 10,
    seatsRemaining: 0,
    isFull: true,
    enrollmentOpensAt: '2026-01-10T00:00:00.000Z',
    enrollmentClosesAt: '2099-02-10T00:00:00.000Z',
    windowState: 'open',
    availability: { canEnroll: false, canWithdraw: false, reason: 'full' },
    myEnrollment: null,
    course: {
      id: 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      code: 'INF/DB/22',
      title: 'Databases',
      credits: 5,
    },
    term: {
      id: '88888888-8888-4888-8888-888888888888',
      code: '2026-SS',
      name: 'Summer 2026',
    },
  },
];

export const offeringResults: OfferingResultsResponseDto = {
  offering: { id: '66666666-6666-4666-8666-666666666666' },
  course: {
    id: '77777777-7777-4777-8777-777777777777',
    code: 'INF/ALG/22',
    title: 'Algorithms',
    credits: 6,
  },
  viewerRole: 'teacher',
  canPublish: true,
  students: [
    {
      enrollmentId: 'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1',
      userId: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      displayName: 'Veronika Gajdošová',
      email: 'veronika@mocku.example',
      enrollmentStatus: 'active',
      nextAttempt: 2,
      attempts: [
        {
          id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
          attempt: 1,
          status: 'official',
          isVoided: false,
          calculated: { grade: 'B', points: 82 },
          proposed: { grade: 'B', at: '2026-06-01T00:00:00.000Z' },
          official: { grade: 'B', recordedAt: '2026-06-10T00:00:00.000Z' },
        },
      ],
    },
    {
      enrollmentId: 'eeeeeee2-eeee-4eee-8eee-eeeeeeeeeee2',
      userId: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      displayName: 'Marek Horváth',
      email: 'marek@mocku.example',
      enrollmentStatus: 'active',
      nextAttempt: 1,
      attempts: [],
    },
  ],
};

export const studyProgress: StudyProgressResponseDto = {
  gradedCourses: 1,
  passedCourses: 1,
  failedCourses: 0,
  creditsEarned: 6,
  creditsAttempted: 6,
  weightedAverage: 1,
  awaitingRetake: 0,
};

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

  http.get(`${PROXY}/institutions/:institutionId/me/course-results`, ({ request }) => {
    const offeringId = new URL(request.url, location.origin).searchParams.get(
      'offeringId',
    );

    return HttpResponse.json(
      offeringId === null
        ? courseResults
        : courseResults.filter(result => result.offering.id === offeringId),
    );
  }),

  http.get(
    `${PROXY}/institutions/:institutionId/me/assessment-results`,
    ({ request }) => {
      const offeringId = new URL(request.url, location.origin).searchParams.get(
        'offeringId',
      );

      return HttpResponse.json(
        offeringId === null
          ? assessmentResults
          : assessmentResults.filter(result => result.offering?.id === offeringId),
      );
    },
  ),

  http.get(`${PROXY}/institutions/:institutionId/me/exam-terms`, ({ request }) => {
    const query = new URL(request.url, location.origin).searchParams;
    const offeringId = query.get('offeringId');
    const kind = query.get('kind');

    return HttpResponse.json(
      examTerms.filter(
        term =>
          (offeringId === null || term.offering.id === offeringId) &&
          (kind === null || term.kind === kind) &&
          startsInRange(term.startsAt, query),
      ),
    );
  }),

  http.get(`${PROXY}/institutions/:institutionId/me/deadlines`, ({ request }) => {
    const query = new URL(request.url, location.origin).searchParams;
    const offeringId = query.get('offeringId');

    return HttpResponse.json(
      deadlines.filter(
        deadline =>
          (offeringId === null || deadline.offering.id === offeringId) &&
          startsInRange(deadline.dueAt, query),
      ),
    );
  }),

  http.get(`${PROXY}/institutions/:institutionId/me/notifications/unread-count`, () =>
    HttpResponse.json({
      unreadCount: notifications.filter(n => n.readAt === null).length,
    }),
  ),

  http.get(`${PROXY}/institutions/:institutionId/me/notifications`, () =>
    HttpResponse.json(notifications),
  ),

  http.post(`${PROXY}/institutions/:institutionId/me/notifications/read-all`, () =>
    HttpResponse.json({ unreadCount: 0 }),
  ),

  http.post(
    `${PROXY}/institutions/:institutionId/me/notifications/:id/read`,
    ({ params }) =>
      HttpResponse.json({
        ...notifications[0],
        id: params['id'] as string,
        readAt: new Date().toISOString(),
      }),
  ),

  http.get(`${PROXY}/institutions/:institutionId/me/timetable-events`, ({ request }) => {
    const query = new URL(request.url, location.origin).searchParams;
    const offeringId = query.get('offeringId');
    const type = query.get('type');

    return HttpResponse.json(
      timetableEvents.filter(
        event =>
          (offeringId === null || event.offering.id === offeringId) &&
          (type === null || event.type === type) &&
          startsInRange(event.startsAt, query),
      ),
    );
  }),

  http.get(`${PROXY}/institutions/:institutionId/me/teaching-offerings`, () =>
    HttpResponse.json(teachingOfferings),
  ),

  http.get(
    `${PROXY}/institutions/:institutionId/course-offerings/:offeringId/roster`,
    () => HttpResponse.json(courseRoster),
  ),

  http.get(`${PROXY}/institutions/:institutionId/course-offerings/:offeringId`, () =>
    HttpResponse.json(courseOffering),
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

  http.get(`${PROXY}/institutions/:institutionId/role-assignments`, () =>
    HttpResponse.json(roleAssignments),
  ),

  http.post(
    `${PROXY}/institutions/:institutionId/role-assignments`,
    async ({ request }) => {
      const body = (await request.json()) as Omit<
        RoleAssignmentResponseDto,
        'id' | 'institutionId' | 'validFrom' | 'validUntil' | 'source' | 'revocable'
      >;

      return HttpResponse.json(
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          institutionId: institutions[0]!.id,
          validFrom: null,
          validUntil: null,
          scopeId: null,
          source: 'granted',
          revocable: true,
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

  http.get(`${PROXY}/institutions/:institutionId/learning-spaces`, () =>
    HttpResponse.json(learningSpaces),
  ),

  http.get(`${PROXY}/institutions/:institutionId/people`, () =>
    HttpResponse.json(people),
  ),

  http.get(
    `${PROXY}/institutions/:institutionId/course-offerings/:offeringId/teaching`,
    () => HttpResponse.json(teachingAssignments),
  ),

  http.post(
    `${PROXY}/institutions/:institutionId/course-offerings/:offeringId/teaching`,
    () =>
      HttpResponse.json({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2' }, { status: 201 }),
  ),

  http.delete(
    `${PROXY}/institutions/:institutionId/course-offerings/:offeringId/teaching/:assignmentId`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${PROXY}/institutions/:institutionId/course-offerings`, () =>
    HttpResponse.json(adminOfferings),
  ),

  http.post(`${PROXY}/institutions/:institutionId/course-offerings`, () =>
    HttpResponse.json(
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
        capacity: null,
        status: 'planned',
        language: null,
      },
      { status: 201 },
    ),
  ),

  http.delete(
    `${PROXY}/institutions/:institutionId/course-offerings/:offeringId`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${PROXY}/institutions/:institutionId/rooms`, () => HttpResponse.json(rooms)),

  http.post(`${PROXY}/institutions/:institutionId/rooms`, () =>
    HttpResponse.json(rooms[0], { status: 201 }),
  ),

  http.delete(
    `${PROXY}/institutions/:institutionId/rooms/:id`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.post(`${PROXY}/institutions/:institutionId/org-units`, () =>
    HttpResponse.json(
      {
        id: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
        institutionId: '55555555-5555-4555-8555-555555555555',
        parentId: null,
        type: 'faculty',
        code: 'NEW',
        name: 'New faculty',
      },
      { status: 201 },
    ),
  ),

  http.delete(
    `${PROXY}/institutions/:institutionId/org-units/:id`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${PROXY}/institutions/:institutionId/academic-terms`, () =>
    HttpResponse.json(academicTerms),
  ),

  http.post(`${PROXY}/institutions/:institutionId/academic-terms`, () =>
    HttpResponse.json(academicTerms[0], { status: 201 }),
  ),

  http.delete(
    `${PROXY}/institutions/:institutionId/academic-terms/:id`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${PROXY}/institutions/:institutionId/programs`, () =>
    HttpResponse.json(programs),
  ),

  http.post(`${PROXY}/institutions/:institutionId/programs`, () =>
    HttpResponse.json(programs[0], { status: 201 }),
  ),

  http.get(`${PROXY}/institutions/:institutionId/courses`, () =>
    HttpResponse.json(catalogueCourses),
  ),

  http.post(`${PROXY}/institutions/:institutionId/courses`, () =>
    HttpResponse.json(catalogueCourses[0], { status: 201 }),
  ),

  http.get(`${PROXY}/institutions/:institutionId/me/enrollments/enrollable`, () =>
    HttpResponse.json(enrollableOfferings),
  ),

  http.post(`${PROXY}/institutions/:institutionId/me/enrollments`, () =>
    HttpResponse.json(
      {
        id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
        courseOfferingId: '66666666-6666-4666-8666-666666666666',
        status: 'requested',
        enrolledAt: '2026-01-20T09:00:00.000Z',
        withdrawnAt: null,
      },
      { status: 201 },
    ),
  ),

  http.delete(`${PROXY}/institutions/:institutionId/me/enrollments/:id`, () =>
    HttpResponse.json({
      id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      courseOfferingId: '66666666-6666-4666-8666-666666666666',
      status: 'withdrawn',
      enrolledAt: null,
      withdrawnAt: '2026-01-21T09:00:00.000Z',
    }),
  ),

  http.get(
    `${PROXY}/institutions/:institutionId/course-offerings/:offeringId/results`,
    () => HttpResponse.json(offeringResults),
  ),

  http.put(
    `${PROXY}/institutions/:institutionId/course-offerings/:offeringId/results/:enrollmentId`,
    () =>
      HttpResponse.json({
        id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
        enrollmentId: 'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1',
        attempt: 1,
        status: 'proposed',
        proposedGrade: 'A',
        officialGrade: null,
      }),
  ),

  http.get(`${PROXY}/institutions/:institutionId/me/course-results/summary`, () =>
    HttpResponse.json(studyProgress),
  ),
];
