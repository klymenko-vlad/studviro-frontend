import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { ForInstitutionsView } from './for-institutions-view';

vi.mock('@/shared/seo', () => ({ JsonLd: () => null }));

describe('ForInstitutionsView', () => {
  it('renders a single top-level heading naming the audience', () => {
    renderWithProviders(<ForInstitutionsView />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'The whole academic year, in one system you own',
    );
  });

  it('offers a demo as the primary action and sign-in as the secondary', () => {
    renderWithProviders(<ForInstitutionsView />);

    const [primary] = screen.getAllByRole('link', { name: /Request a demo/ });
    expect(primary).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });

  it('leaves no link without a destination', () => {
    renderWithProviders(<ForInstitutionsView />);

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('href');
    }
  });

  it('resolves every string instead of rendering a message key', () => {
    const { container } = renderWithProviders(<ForInstitutionsView />);

    expect(container.textContent).not.toMatch(/marketing\.|forInstitutions\./);
  });

  it('says what is not built yet', () => {
    renderWithProviders(<ForInstitutionsView />);

    expect(
      screen.getByRole('heading', { name: /What is missing, named/i }),
    ).toBeInTheDocument();
  });
});
