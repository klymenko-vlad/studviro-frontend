import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { TeacherOfferingPageDto, TeacherProfileResponseDto } from '@/shared/api';
import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  userEvent,
} from '@/shared/test';

import { TeacherProfile } from './teacher-profile';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const TEACHER = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
const PROFILE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/teachers/${TEACHER}`;
const OFFERINGS_URL = `${PROFILE_URL}/offerings`;

const peter: TeacherProfileResponseDto = {
  id: TEACHER,
  displayName: 'Peter Novák',
  email: 'peter.novak@ukf.sk',
  departments: [
    {
      id: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
      code: 'KI',
      name: 'Department of Informatics',
    },
  ],
};

const algorithms = {
  offeringId: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  courseTitle: 'Algorithms',
  courseCode: 'INF/ALG/22',
  termName: 'Winter 2026/2027',
  viewerCanOpen: true,
};

const formalLanguages = {
  offeringId: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  courseTitle: 'Formal Languages',
  courseCode: 'INF/FJ/22',
  termName: 'Summer 2026/2027',
  viewerCanOpen: false,
};

const page = (
  items: TeacherOfferingPageDto['items'],
  nextCursor: string | null = null,
): TeacherOfferingPageDto => ({
  items,
  meta: { limit: 20, hasNextPage: nextCursor !== null, nextCursor },
});

const serve = (
  offerings: (url: URL) => TeacherOfferingPageDto = () =>
    page([algorithms, formalLanguages]),
) => {
  server.use(
    http.get(PROFILE_URL, () => HttpResponse.json(peter)),
    http.get(OFFERINGS_URL, ({ request }) =>
      HttpResponse.json(offerings(new URL(request.url))),
    ),
  );
};

const render = () =>
  renderWithProviders(<TeacherProfile institutionId={INSTITUTION} teacherId={TEACHER} />);

describe('TeacherProfile', () => {
  it('names the teacher and gives a way to write to them', async () => {
    serve();

    render();

    expect(
      await screen.findByRole('heading', { name: 'Peter Novák', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'peter.novak@ukf.sk' })).toHaveAttribute(
      'href',
      'mailto:peter.novak@ukf.sk',
    );
    expect(screen.getByText('Department of Informatics')).toBeInTheDocument();
  });

  it('links the courses the reader can open and only names the others', async () => {
    serve();

    render();

    expect(await screen.findByRole('link', { name: /Algorithms/ })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses/aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1`,
    );
    expect(screen.getByText('Formal Languages')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Formal Languages/ }),
    ).not.toBeInTheDocument();
  });

  it('loads the next page of courses on request', async () => {
    serve(url =>
      url.searchParams.get('cursor') === 'next'
        ? page([formalLanguages])
        : page([algorithms], 'next'),
    );

    render();
    await screen.findByRole('link', { name: /Algorithms/ });
    expect(screen.queryByText('Formal Languages')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Formal Languages')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('narrows the courses on the server as the reader types', async () => {
    serve(url =>
      url.searchParams.get('q') === 'formal'
        ? page([formalLanguages])
        : page([algorithms, formalLanguages]),
    );

    render();
    await screen.findByRole('link', { name: /Algorithms/ });

    await userEvent.type(screen.getByLabelText('Filter courses'), 'formal');

    expect(await screen.findByText('Formal Languages')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Algorithms/ })).not.toBeInTheDocument();
  });

  it('says when nothing matches the filter', async () => {
    serve(url => (url.searchParams.get('q') === 'zzz' ? page([]) : page([algorithms])));

    render();
    await screen.findByRole('link', { name: /Algorithms/ });

    await userEvent.type(screen.getByLabelText('Filter courses'), 'zzz');

    expect(await screen.findByText('No course matches “zzz”.')).toBeInTheDocument();
  });

  it('says so when the teacher teaches nothing on record', async () => {
    serve(() => page([]));

    render();

    expect(await screen.findByText('No courses on record.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Filter courses')).not.toBeInTheDocument();
  });

  it('explains a profile that does not exist rather than showing an empty page', async () => {
    server.use(
      http.get(PROFILE_URL, () =>
        HttpResponse.json(errorResponse(404, 'Missing', 'Not Found'), { status: 404 }),
      ),
    );

    render();

    expect(await screen.findByText('No such teacher')).toBeInTheDocument();
  });

  it('reports a failure to load', async () => {
    server.use(
      http.get(PROFILE_URL, () =>
        HttpResponse.json(errorResponse(500, 'Boom'), { status: 500 }),
      ),
    );

    render();

    expect(
      await screen.findByText('The profile could not be loaded'),
    ).toBeInTheDocument();
  });
});
