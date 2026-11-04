import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { permissions, renderWithProviders, screen, server } from '@/shared/test';

import { InstitutionPeopleView } from './institution-people-view';

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/institutions/x/people',
  useSearchParams: () => new URLSearchParams(),
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

describe('InstitutionPeopleView', () => {
  it('puts inviting someone beside the directory and the roles', async () => {
    renderWithProviders(<InstitutionPeopleView institutionId={INSTITUTION} />);

    expect(await screen.findByRole('tab', { name: 'Directory' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Invite' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Roles' })).toBeInTheDocument();
  });

  it('shows a reader the directory alone', async () => {
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json({ ...permissions, roles: [], permissions: ['role:read'] }),
      ),
    );
    renderWithProviders(<InstitutionPeopleView institutionId={INSTITUTION} />);

    expect(
      await screen.findByRole('heading', { name: 'People', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Invite' })).not.toBeInTheDocument();
  });
});
