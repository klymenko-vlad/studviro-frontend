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

const holding = (held: string[]) => {
  server.use(
    http.get(PERMISSIONS_URL, () =>
      HttpResponse.json({ ...permissions, roles: [], permissions: held }),
    ),
  );
};

describe('InstitutionLearningView', () => {
  it('names the screen for somebody who administers course offerings', async () => {
    render();

    expect(
      screen.getByRole('heading', { name: 'Course pages', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText('Algorithms and Data Structures')).toHaveLength(2);
    expect(screen.getByText('ALG/WS26')).toBeInTheDocument();
  });

  it('counts the pages written', async () => {
    render();

    expect(
      await screen.findByText('2 course pages in this institution.'),
    ).toBeInTheDocument();
  });

  it('says how many offerings are still waiting for one', async () => {
    render();

    expect(
      await screen.findByText('3 offerings have no course page yet.'),
    ).toBeInTheDocument();
  });

  it('says so plainly when every offering has a page', async () => {
    server.use(
      http.get(SPACES_URL, () =>
        HttpResponse.json({
          ...learningSpaces,
          total: 1,
          offeringsWithoutPage: 0,
          spaces: [learningSpaces.spaces[0]],
        }),
      ),
    );

    render();

    expect(
      await screen.findByText('Every course offering has a page.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('3 offerings have no course page yet.'),
    ).not.toBeInTheDocument();
  });

  it('marks a page whose course was withdrawn', async () => {
    render();

    expect(await screen.findByText('Course withdrawn')).toBeInTheDocument();
  });

  it('reports a server failure rather than an empty table', async () => {
    server.use(http.get(SPACES_URL, () => new HttpResponse(null, { status: 500 })));

    render();

    expect(
      await screen.findByText('Course pages could not be loaded'),
    ).toBeInTheDocument();
  });

  it('refuses a student, who may read offerings but administers none', async () => {
    holding(['offering:read', 'notification:read']);

    render();

    expect(await screen.findByText('This index is not yours to see')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('refuses somebody holding nothing at all', async () => {
    holding([]);

    render();

    expect(await screen.findByText('This index is not yours to see')).toBeInTheDocument();
  });
});
