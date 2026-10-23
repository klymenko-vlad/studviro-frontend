import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { AccountView } from './account-view';

function renderView() {
  return renderWithProviders(
    <AccountView displayName="Ada Lovelace" email="ada@studviro.local" />,
  );
}

describe('AccountView', () => {
  it('heads the page with the person it belongs to', () => {
    renderView();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ada Lovelace');
    expect(screen.getByText('ada@studviro.local')).toBeInTheDocument();
  });

  it('leads to the settings and security page', () => {
    renderView();

    expect(screen.getByRole('link', { name: 'Settings and security' })).toHaveAttribute(
      'href',
      '/account/settings',
    );
  });

  it('puts the institutions first, then sign-in and the person’s data', async () => {
    renderView();

    expect(
      await screen.findByRole('heading', { name: 'Your institutions', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'University sign-in' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Download your data' }),
    ).toBeInTheDocument();
  });

  it('shows roles within each institution rather than as a list of their own', async () => {
    renderView();

    expect(await screen.findByText('Student')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Roles' })).not.toBeInTheDocument();
  });
});
