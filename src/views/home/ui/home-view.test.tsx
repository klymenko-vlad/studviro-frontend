import { describe, expect, it, vi } from 'vitest';

import { renderAndAudit, renderWithProviders, screen } from '@/shared/test';

import { HomeView } from './home-view';

// `JsonLd` resolves the CSP nonce from the request, which no test tree has.
vi.mock('@/shared/seo', () => ({ JsonLd: () => null }));

describe('HomeView', () => {
  it('renders a single top-level heading', () => {
    renderWithProviders(<HomeView signedIn={false} />);

    // One h1 per page — more than one breaks screen-reader document outline.
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('leads with what the product does rather than with its own name', () => {
    renderWithProviders(<HomeView signedIn={false} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'One academic platform your institution runs itself',
    );
  });

  it('makes requesting a demo the primary way in for a signed-out visitor', () => {
    renderWithProviders(<HomeView signedIn={false} />);

    const [primary] = screen.getAllByRole('link', { name: /Request a demo/ });
    expect(primary).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });

  it('sends a signed-in visitor onward instead of offering sign-in again', () => {
    renderWithProviders(<HomeView signedIn />);

    expect(screen.getByRole('link', { name: 'Go to your account' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('cross-links every audience page', () => {
    renderWithProviders(<HomeView signedIn={false} />);

    expect(screen.getAllByRole('link', { name: 'Students' })[0]).toHaveAttribute(
      'href',
      '/for-students',
    );
    expect(screen.getAllByRole('link', { name: 'Teachers' })[0]).toHaveAttribute(
      'href',
      '/for-teachers',
    );
    expect(screen.getAllByRole('link', { name: 'Institutions' })[0]).toHaveAttribute(
      'href',
      '/for-institutions',
    );
  });

  it('leaves no call to action that goes nowhere', () => {
    renderWithProviders(<HomeView signedIn={false} />);

    // The scaffold shipped two `<Button>`s with neither href nor handler, which
    // is how the landing page spent several steps with no way to sign in.
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('href');
    }
  });

  it('resolves every string instead of rendering a message key', () => {
    const { container } = renderWithProviders(<HomeView signedIn={false} />);

    expect(container.textContent).not.toMatch(/marketing\.|home\./);
  });

  it('describes the learning system as roadmap rather than as shipped', () => {
    renderWithProviders(<HomeView signedIn={false} />);

    // Moodle import is Planned in Feature Status; claiming it here would make
    // the landing page the only place in the product that says otherwise.
    expect(
      screen.getByText(
        /Course materials, assignments and submissions are the next phase/,
      ),
    ).toBeInTheDocument();
  });
});

describe('HomeView accessibility', () => {
  it('has no axe violations — the public landing', async () => {
    await renderAndAudit(<HomeView signedIn={false} />);
  });
});
