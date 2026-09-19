import { describe, expect, it } from 'vitest';

import {
  expectNoAxeViolations,
  renderAndAudit,
  renderWithProviders,
  screen,
} from '@/shared/test';

import { InstitutionCatalogueView } from './institution-catalogue-view';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';

describe('InstitutionCatalogueView', () => {
  it('names every table so the scroll region it sits in has an accessible name', async () => {
    renderWithProviders(<InstitutionCatalogueView institutionId={INSTITUTION} />);

    expect(await screen.findByRole('table', { name: 'Programmes' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Courses' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Programmes' })).toHaveAttribute(
      'tabindex',
      '0',
    );
  });
});

describe('InstitutionCatalogueView accessibility', () => {
  it('has no axe violations — a table screen', async () => {
    await renderAndAudit(<InstitutionCatalogueView institutionId={INSTITUTION} />, () =>
      screen.findByRole('table', { name: 'Programmes' }),
    );
  });

  it('has no axe violations inside a single table region', async () => {
    renderWithProviders(<InstitutionCatalogueView institutionId={INSTITUTION} />);

    await expectNoAxeViolations(await screen.findByRole('region', { name: 'Courses' }));
  });
});
