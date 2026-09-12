import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { renderWithProviders, screen } from '@/shared/test';

import { AppHeaderBar } from './app-header-bar';

// `SignOut` reaches for the app router, which no test tree mounts.
vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe('AppHeaderBar', () => {
  it('always links the brand back to the landing page', () => {
    renderWithProviders(<AppHeaderBar signedIn={false} />);

    expect(screen.getByRole('link', { name: 'Studviro' })).toHaveAttribute('href', '/');
  });

  it('offers a signed-out visitor sign in and sign up', () => {
    renderWithProviders(<AppHeaderBar signedIn={false} />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute(
      'href',
      '/sign-up',
    );
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('points a signed-out visitor at each audience page', () => {
    renderWithProviders(<AppHeaderBar signedIn={false} />);

    expect(screen.getByRole('link', { name: 'For students' })).toHaveAttribute(
      'href',
      '/for-students',
    );
    expect(screen.getByRole('link', { name: 'For teachers' })).toHaveAttribute(
      'href',
      '/for-teachers',
    );
    expect(screen.getByRole('link', { name: 'For institutions' })).toHaveAttribute(
      'href',
      '/for-institutions',
    );
  });

  it('drops the marketing navigation once there is a session', () => {
    renderWithProviders(<AppHeaderBar signedIn />);

    // A signed-in header is about the app, not about the product.
    expect(screen.queryByRole('link', { name: 'For students' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Product' })).not.toBeInTheDocument();
  });

  it('offers a signed-in visitor their account and a way out', () => {
    renderWithProviders(<AppHeaderBar signedIn />);

    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  });
});
