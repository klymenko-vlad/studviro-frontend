import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server, within } from '@/shared/test';

import { MyDataExport } from './my-data-export';
import { MyInstitutions } from './my-institutions';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;
const ROLES_URL = '/api/proxy/api/v1/users/me/roles';

describe('MyInstitutions', () => {
  it('opens an institution’s dashboard from its card', async () => {
    renderWithProviders(<MyInstitutions />);

    expect(
      await screen.findByRole('link', { name: 'Pavol Jozef Šafárik University' }),
    ).toHaveAttribute('href', `/institutions/${INSTITUTION}`);
  });

  it('shows the roles the person holds there, and how far a narrow one reaches', async () => {
    renderWithProviders(<MyInstitutions />);

    const card = within(
      (
        await screen.findByRole('link', { name: 'Pavol Jozef Šafárik University' })
      ).closest('li') as HTMLElement,
    );
    expect(await card.findByText('Student')).toBeInTheDocument();
    expect(card.getByText('Registrar')).toBeInTheDocument();
    expect(card.getByText('Course offering')).toBeInTheDocument();
  });

  it('names a role once even when it is held twice', async () => {
    server.use(
      http.get(ROLES_URL, () =>
        HttpResponse.json([
          {
            institutionId: INSTITUTION,
            userId: '11111111-1111-4111-8111-111111111111',
            role: 'student',
            scopeType: 'institution',
            source: 'granted',
            revocable: false,
          },
          {
            institutionId: INSTITUTION,
            userId: '11111111-1111-4111-8111-111111111111',
            role: 'student',
            scopeType: 'institution',
            source: 'derived',
            revocable: false,
          },
        ]),
      ),
    );

    renderWithProviders(<MyInstitutions />);

    expect(await screen.findAllByText('Student')).toHaveLength(1);
  });

  it('offers role administration to someone who may assign roles', async () => {
    renderWithProviders(<MyInstitutions />);

    expect(await screen.findByRole('link', { name: 'Manage roles' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/people?tab=roles`,
    );
  });

  it('hides role administration from someone who may not', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({
          ...permissions,
          roles: ['student'],
          permissions: ['role:read'],
        }),
      ),
    );

    renderWithProviders(<MyInstitutions />);

    expect(
      await screen.findByRole('link', { name: 'Pavol Jozef Šafárik University' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage roles' })).not.toBeInTheDocument();
  });

  it('offers the course list to someone who may read enrolments', async () => {
    renderWithProviders(<MyInstitutions />);

    expect(await screen.findByRole('link', { name: 'My courses' })).toHaveAttribute(
      'href',
      `/institutions/${INSTITUTION}/courses`,
    );
  });

  it('explains belonging to no institution at all', async () => {
    server.use(http.get('/api/proxy/api/v1/institutions', () => HttpResponse.json([])));

    renderWithProviders(<MyInstitutions />);

    expect(
      await screen.findByText('You do not belong to any institution yet.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Once a school adds you, it appears here.'),
    ).toBeInTheDocument();
  });
});

describe('MyDataExport', () => {
  it('offers a copy of what each institution holds about the person', async () => {
    renderWithProviders(<MyDataExport />);

    expect(await screen.findByText('Pavol Jozef Šafárik University')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download my data' })).toBeInTheDocument();
  });

  it('has nothing to export without an institution', async () => {
    server.use(http.get('/api/proxy/api/v1/institutions', () => HttpResponse.json([])));

    renderWithProviders(<MyDataExport />);

    expect(
      await screen.findByText(
        'There is nothing to download until you join an institution.',
      ),
    ).toBeInTheDocument();
  });
});
