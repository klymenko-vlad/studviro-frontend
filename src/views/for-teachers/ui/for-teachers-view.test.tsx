import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { ForTeachersView } from './for-teachers-view';

vi.mock('@/shared/seo', () => ({ JsonLd: () => null }));

describe('ForTeachersView', () => {
  it('renders a single top-level heading naming the audience', () => {
    renderWithProviders(<ForTeachersView />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Your teaching, without the second login',
    );
  });

  it('offers a demo as the primary action and sign-in as the secondary', () => {
    renderWithProviders(<ForTeachersView />);

    const [primary] = screen.getAllByRole('link', { name: /Request a demo/ });
    expect(primary).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });

  it('leaves no link without a destination', () => {
    renderWithProviders(<ForTeachersView />);

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('href');
    }
  });

  it('resolves every string instead of rendering a message key', () => {
    const { container } = renderWithProviders(<ForTeachersView />);

    expect(container.textContent).not.toMatch(/marketing\.|forTeachers\./);
  });

  it('says what is not built yet', () => {
    renderWithProviders(<ForTeachersView />);

    expect(screen.getByRole('heading', { name: /Not yet|roadmap/i })).toBeInTheDocument();
  });
});
