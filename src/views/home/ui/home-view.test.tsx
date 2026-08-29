import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { HomeView } from './home-view';

describe('HomeView', () => {
  it('renders a single top-level heading from the message catalogue', () => {
    renderWithProviders(<HomeView signedIn={false} />);

    // One h1 per page — more than one breaks screen-reader document outline.
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Studviro');
  });

  it('renders the localised subtitle rather than a raw message key', () => {
    renderWithProviders(<HomeView signedIn={false} />);

    expect(
      screen.getByText(
        'Your courses, grades and timetable from every university system, in one place.',
      ),
    ).toBeInTheDocument();
  });

  it('offers a signed-out visitor both a way in and a way to register', () => {
    renderWithProviders(<HomeView signedIn={false} />);

    expect(screen.getByRole('link', { name: /Create an account/ })).toHaveAttribute(
      'href',
      '/sign-up',
    );
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });

  it('sends a signed-in visitor onward instead of offering registration again', () => {
    renderWithProviders(<HomeView signedIn />);

    expect(screen.getByRole('link', { name: /Go to your account/ })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(
      screen.queryByRole('link', { name: /Create an account/ }),
    ).not.toBeInTheDocument();
  });

  it('leaves no call to action that goes nowhere', () => {
    renderWithProviders(<HomeView signedIn={false} />);

    // The scaffold shipped two `<Button>`s with neither href nor handler, which
    // is how the landing page spent several steps with no way to sign in.
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
