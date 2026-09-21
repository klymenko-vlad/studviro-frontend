import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { Button } from './button';
import { PageHeader, PageShell } from './page-shell';

describe('PageShell', () => {
  it('is the main landmark the skip link targets', () => {
    renderWithProviders(
      <PageShell>
        <p>Content</p>
      </PageShell>,
    );

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('picks the named content width rather than an arbitrary one', () => {
    renderWithProviders(
      <PageShell width="form">
        <p>Content</p>
      </PageShell>,
    );

    expect(screen.getByRole('main')).toHaveClass('max-w-lg');
  });

  it('defaults to the index width', () => {
    renderWithProviders(
      <PageShell>
        <p>Content</p>
      </PageShell>,
    );

    expect(screen.getByRole('main')).toHaveClass('max-w-6xl');
  });
});

describe('PageHeader', () => {
  it('renders the title as the single h1 of the page', () => {
    renderWithProviders(<PageHeader title="My courses" />);

    expect(screen.getByRole('heading', { level: 1, name: 'My courses' })).toBeVisible();
  });

  it('adds the description and the actions only when given them', () => {
    const { rerender } = renderWithProviders(<PageHeader title="My courses" />);

    expect(screen.queryByText('Everything you take')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(
      <PageHeader
        title="My courses"
        description="Everything you take"
        actions={<Button>Enrol</Button>}
      />,
    );

    expect(screen.getByText('Everything you take')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enrol' })).toBeInTheDocument();
  });
});
