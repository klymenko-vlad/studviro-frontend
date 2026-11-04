import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import {
  permissions,
  renderAndAudit,
  renderWithProviders,
  screen,
  server,
} from '@/shared/test';

import { InstitutionOfferView } from './institution-offer-view';

const search = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/institutions/x/offer',
  useSearchParams: () => search.value,
}));

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const PERMISSIONS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/permissions`;

const holding = (held: string[]) => {
  server.use(
    http.get(PERMISSIONS_URL, () =>
      HttpResponse.json({ ...permissions, roles: [], permissions: held }),
    ),
  );
};

const render = () =>
  renderWithProviders(<InstitutionOfferView institutionId={INSTITUTION} />);

describe('InstitutionOfferView', () => {
  beforeEach(() => {
    search.value = new URLSearchParams();
  });

  it('gathers programmes, courses, offerings and course pages under one page', async () => {
    holding(['course:read', 'offering:read', 'offering:manage']);
    render();

    expect(
      await screen.findByRole('tab', { name: 'Programmes & courses' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Offerings' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Course pages' })).toBeInTheDocument();
  });

  it('opens on the tab the address names', async () => {
    holding(['course:read', 'offering:read', 'offering:manage']);
    search.value = new URLSearchParams('tab=offerings');
    render();

    expect(await screen.findByRole('tab', { name: 'Offerings' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('offers only the tabs the person may open', async () => {
    holding(['course:read']);
    render();

    expect(
      await screen.findByRole('heading', { name: 'Programmes' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('refuses somebody who may read none of it', async () => {
    holding([]);
    render();

    expect(await screen.findByText('Not available to you')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    holding(['course:read', 'offering:read', 'offering:manage']);
    await renderAndAudit(
      <InstitutionOfferView institutionId={INSTITUTION} />,
      async () => {
        await screen.findByRole('tab', { name: 'Offerings' });
      },
    );
  });
});
