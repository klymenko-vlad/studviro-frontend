import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test/render';

import { HomeView } from './home-view';

describe('HomeView', () => {
  it('renders a single top-level heading from the message catalogue', () => {
    renderWithProviders(<HomeView />);

    // One h1 per page — more than one breaks screen-reader document outline.
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Studviro');
  });

  it('offers a way through to the account page', () => {
    renderWithProviders(<HomeView />);

    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it('renders the localised subtitle rather than a raw message key', () => {
    renderWithProviders(<HomeView />);

    expect(screen.getByText('The platform foundation is in place.')).toBeInTheDocument();
  });
});
