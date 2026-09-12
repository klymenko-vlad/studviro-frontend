import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { ForStudentsView } from './for-students-view';

vi.mock('@/shared/seo', () => ({ JsonLd: () => null }));

describe('ForStudentsView', () => {
  it('renders a single top-level heading naming the audience', () => {
    renderWithProviders(<ForStudentsView />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Stop assembling your own timetable',
    );
  });

  it('offers a demo as the primary action and sign-in as the secondary', () => {
    renderWithProviders(<ForStudentsView />);

    const [primary] = screen.getAllByRole('link', { name: /Request a demo/ });
    expect(primary).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });

  it('leaves no link without a destination', () => {
    renderWithProviders(<ForStudentsView />);

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('href');
    }
  });

  it('resolves every string instead of rendering a message key', () => {
    const { container } = renderWithProviders(<ForStudentsView />);

    expect(container.textContent).not.toMatch(/marketing\.|forStudents\./);
  });

  it('says what is not built yet', () => {
    renderWithProviders(<ForStudentsView />);

    expect(screen.getByRole('heading', { name: /Not yet|roadmap/i })).toBeInTheDocument();
  });
});
