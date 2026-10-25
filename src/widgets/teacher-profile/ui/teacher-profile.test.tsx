import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { TeacherProfileResponseDto } from '@/shared/api';
import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { TeacherProfile } from './teacher-profile';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const TEACHER = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
const PROFILE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/teachers/${TEACHER}`;

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
  offerings: [
    {
      offeringId: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      courseTitle: 'Algorithms',
      courseCode: 'INF/ALG/22',
      termName: 'Winter 2026/2027',
      viewerCanOpen: true,
    },
    {
      offeringId: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      courseTitle: 'Formal Languages',
      courseCode: 'INF/FJ/22',
      termName: 'Summer 2026/2027',
      viewerCanOpen: false,
    },
  ],
};

const render = () =>
  renderWithProviders(<TeacherProfile institutionId={INSTITUTION} teacherId={TEACHER} />);

describe('TeacherProfile', () => {
  it('names the teacher and gives a way to write to them', async () => {
    server.use(http.get(PROFILE_URL, () => HttpResponse.json(peter)));

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
    server.use(http.get(PROFILE_URL, () => HttpResponse.json(peter)));

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

  it('says so when the teacher teaches nothing on record', async () => {
    server.use(
      http.get(PROFILE_URL, () =>
        HttpResponse.json({ ...peter, departments: [], offerings: [] }),
      ),
    );

    render();

    expect(await screen.findByText('No courses on record.')).toBeInTheDocument();
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
