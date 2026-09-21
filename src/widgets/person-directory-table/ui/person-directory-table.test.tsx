import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { PersonDirectoryTable } from './person-directory-table';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PEOPLE_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/people`;

const admin = {
  userId: '11111111-1111-4111-8111-111111111111',
  email: 'admin@upjs.sk',
  displayName: 'Ada Admin',
  status: 'active',
  roles: [
    {
      id: '99999999-9999-4999-8999-999999999999',
      institutionId: INSTITUTION,
      userId: '11111111-1111-4111-8111-111111111111',
      role: 'institution_admin',
      scopeType: 'institution',
      scopeId: null,
      validFrom: null,
      validUntil: null,
      source: 'granted',
      revocable: true,
    },
  ],
};

const student = {
  userId: '22222222-2222-4222-8222-222222222222',
  email: 'student@upjs.sk',
  displayName: 'Sam Student',
  status: 'active',
  roles: [
    {
      id: null,
      institutionId: INSTITUTION,
      userId: '22222222-2222-4222-8222-222222222222',
      role: 'student',
      scopeType: 'institution',
      scopeId: null,
      validFrom: null,
      validUntil: null,
      source: 'derived',
      revocable: false,
    },
  ],
};

/** The endpoint is keyset-paginated; a bare array is no longer its shape. */
const page = (items: unknown[]) => ({
  items,
  meta: { limit: 100, hasNextPage: false, nextCursor: null },
});

describe('PersonDirectoryTable', () => {
  it('lists a person and their role', async () => {
    server.use(http.get(PEOPLE_URL, () => HttpResponse.json(page([admin]))));

    renderWithProviders(<PersonDirectoryTable institutionId={INSTITUTION} />);

    expect(await screen.findByText('Ada Admin')).toBeInTheDocument();
    expect(screen.getByText('admin@upjs.sk')).toBeInTheDocument();
    expect(screen.getByText('Institution administrator')).toBeInTheDocument();
  });

  it('shows a derived role alongside a granted one', async () => {
    server.use(http.get(PEOPLE_URL, () => HttpResponse.json(page([admin, student]))));

    renderWithProviders(<PersonDirectoryTable institutionId={INSTITUTION} />);

    expect(await screen.findByText('Sam Student')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('explains an institution with nobody in it', async () => {
    server.use(http.get(PEOPLE_URL, () => HttpResponse.json(page([]))));

    renderWithProviders(<PersonDirectoryTable institutionId={INSTITUTION} />);

    expect(
      await screen.findByText('This institution has no people yet.'),
    ).toBeInTheDocument();
  });

  it('reports a refusal instead of an empty table', async () => {
    server.use(
      http.get(PEOPLE_URL, () =>
        HttpResponse.json(errorResponse(403, 'Denied', 'Forbidden'), { status: 403 }),
      ),
    );

    renderWithProviders(<PersonDirectoryTable institutionId={INSTITUTION} />);

    expect(await screen.findByText('People could not be loaded')).toBeInTheDocument();
  });
});
