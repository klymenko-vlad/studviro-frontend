import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { MyTeachingView } from './my-teaching-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

describe('MyTeachingView', () => {
  it('lists the offerings of someone who is teaching staff', async () => {
    renderWithProviders(<MyTeachingView institutionId={INSTITUTION} />);

    expect(
      screen.getByRole('heading', { name: 'My teaching', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Algorithms')).toBeInTheDocument();
  });

  it('refuses a student, who holds offering:read but teaches nothing', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({
          ...permissions,
          roles: ['student'],
          permissions: ['offering:read', 'enrollment:read'],
        }),
      ),
    );

    renderWithProviders(<MyTeachingView institutionId={INSTITUTION} />);

    expect(await screen.findByText('Not available to you')).toBeInTheDocument();
    expect(screen.queryByText('Algorithms')).not.toBeInTheDocument();
  });
});
