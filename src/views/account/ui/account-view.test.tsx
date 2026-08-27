import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { AccountView } from './account-view';

describe('AccountView', () => {
  it('renders a single top-level heading', () => {
    renderWithProviders(<AccountView />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Account');
  });

  it('composes both account sections', async () => {
    renderWithProviders(<AccountView />);

    expect(await screen.findByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Linked accounts')).toBeInTheDocument();
  });
});
