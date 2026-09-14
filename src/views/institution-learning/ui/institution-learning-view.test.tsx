import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  learningSpaces,
  permissions,
  renderWithProviders,
  screen,
  server,
} from '@/shared/test';

import { InstitutionLearningView } from './institution-learning-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;
const SPACES_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/learning-spaces`;

const render = () =>
  renderWithProviders(<InstitutionLearningView institutionId={INSTITUTION} />);

const withoutPermission = () => {
  server.use(
    http.get(PERMISSIONS_URL, () =>
      HttpResponse.json({
        ...permissions,
        roles: [],
        permissions: ['notification:read'],
      }),
    ),
  );
};

describe('InstitutionLearningView', () => {
  it('names the screen for someone who may read course offerings', async () => {
    render();

    expect(
      screen.getByRole('heading', { name: 'Learning spaces', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText('Algorithms and Data Structures')).toHaveLength(2);
    expect(screen.getByText('ALG/WS26')).toBeInTheDocument();
  });

  it('reports how many spaces matched a course offering', async () => {
    render();

    expect(
      await screen.findByText(
        '2 learning spaces, 1 of them matched to a course offering.',
      ),
    ).toBeInTheDocument();
  });

  it('warns that some spaces match no offering, and marks the row', async () => {
    render();

    expect(
      await screen.findByText('Some spaces match no course offering'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Not matched')).toBeInTheDocument();
  });

  it('stays quiet about unmatched spaces when every one of them matched', async () => {
    server.use(
      http.get(SPACES_URL, () =>
        HttpResponse.json({
          ...learningSpaces,
          total: 1,
          linked: 1,
          unlinked: 0,
          spaces: [learningSpaces.spaces[0]],
        }),
      ),
    );

    render();

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(
      screen.queryByText('Some spaces match no course offering'),
    ).not.toBeInTheDocument();
  });

  it('explains what to do when nothing has been imported yet', async () => {
    server.use(
      http.get(SPACES_URL, () =>
        HttpResponse.json({ total: 0, linked: 0, unlinked: 0, spaces: [] }),
      ),
    );

    render();

    expect(await screen.findByText('No learning spaces yet')).toBeInTheDocument();
  });

  it('reports a server failure rather than an empty table', async () => {
    server.use(http.get(SPACES_URL, () => new HttpResponse(null, { status: 500 })));

    render();

    expect(
      await screen.findByText('Learning spaces could not be loaded'),
    ).toBeInTheDocument();
  });

  it('refuses someone without offering:read', async () => {
    withoutPermission();

    render();

    expect(
      await screen.findByText('These learning spaces are not yours to see'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
