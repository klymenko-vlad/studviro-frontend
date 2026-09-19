import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { renderWithProviders, screen } from '@/shared/test';

import { AppHeaderBar } from './app-header-bar';

// `SignOutMenuItem` reaches for the app router, which no test tree mounts.
vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const SIGNED_IN = {
  signedIn: true,
  displayName: 'Ada Lovelace',
  email: 'ada@studviro.local',
} as const;

async function openAccountMenu(isPlatformOperator = false) {
  const { user } = renderWithProviders(
    <AppHeaderBar {...SIGNED_IN} isPlatformOperator={isPlatformOperator} />,
  );
  await user.click(screen.getByRole('button', { name: 'Account menu' }));
  await screen.findByRole('menuitem', { name: 'Account' });
}

describe('AppHeaderBar', () => {
  it('always links the brand back to the landing page', () => {
    renderWithProviders(<AppHeaderBar signedIn={false} />);

    expect(screen.getByRole('link', { name: 'StudViro home' })).toHaveAttribute(
      'href',
      '/',
    );
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
    expect(
      screen.queryByRole('button', { name: 'Account menu' }),
    ).not.toBeInTheDocument();
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

  it('keeps the theme and the language reachable without a session', () => {
    renderWithProviders(<AppHeaderBar signedIn={false} />);

    expect(
      screen.getByRole('button', { name: 'Theme and language' }),
    ).toBeInTheDocument();
  });

  it('offers a narrow signed-out screen the same links behind one trigger', () => {
    renderWithProviders(<AppHeaderBar signedIn={false} />);

    // The bar itself never wraps; the sheet carries what does not fit.
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('drops the marketing navigation once there is a session', () => {
    renderWithProviders(<AppHeaderBar {...SIGNED_IN} />);

    // A signed-in header is about the app, not about the product.
    expect(screen.queryByRole('link', { name: 'For students' })).not.toBeInTheDocument();
  });

  it('spends one control on the account rather than a row of buttons', () => {
    renderWithProviders(<AppHeaderBar {...SIGNED_IN} />);

    // The account, the language, the theme and the way out used to be five
    // always-visible buttons. They are all behind this one trigger now.
    expect(screen.getByRole('button', { name: 'Account menu' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Account' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('names the person the session belongs to', async () => {
    await openAccountMenu();

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@studviro.local')).toBeInTheDocument();
  });

  it('offers a signed-in visitor their account and a way out', async () => {
    await openAccountMenu();

    expect(screen.getByRole('menuitem', { name: 'Account' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('offers a platform operator the way to create an institution', async () => {
    await openAccountMenu(true);

    expect(screen.getByRole('menuitem', { name: 'Create institution' })).toHaveAttribute(
      'href',
      '/institutions/new',
    );
  });

  it('hides institution creation from an ordinary account', async () => {
    await openAccountMenu();

    expect(
      screen.queryByRole('menuitem', { name: 'Create institution' }),
    ).not.toBeInTheDocument();
  });
});
