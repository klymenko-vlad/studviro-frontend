import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { Button } from './button';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('states what is missing', () => {
    renderWithProviders(<EmptyState title="Nothing here yet" />);

    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('carries the action that resolves it', () => {
    renderWithProviders(
      <EmptyState
        title="You are not enrolled in any course yet"
        action={<Button>Browse courses</Button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Browse courses' })).toBeInTheDocument();
  });

  it('adds the explanation only when it is given one', () => {
    const { rerender } = renderWithProviders(<EmptyState title="Empty" />);

    expect(screen.queryByText('Why it is empty')).not.toBeInTheDocument();

    rerender(<EmptyState title="Empty" description="Why it is empty" />);

    expect(screen.getByText('Why it is empty')).toBeInTheDocument();
  });

  it('hides a decorative icon from the accessibility tree', () => {
    renderWithProviders(<EmptyState title="Empty" icon={<svg data-testid="glyph" />} />);

    expect(screen.getByTestId('glyph').closest('[aria-hidden]')).not.toBeNull();
  });
});
