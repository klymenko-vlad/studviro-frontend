import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { QueryError } from './query-error';

describe('QueryError', () => {
  it('announces itself as an error rather than as quiet text', () => {
    renderWithProviders(<QueryError title="Courses could not be loaded" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Courses could not be loaded');
  });

  it('offers the way out when the caller can retry', async () => {
    const onRetry = vi.fn();
    const { user } = renderWithProviders(
      <QueryError title="Failed" description="Try in a moment." onRetry={onRetry} />,
    );

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('offers no retry when there is nothing to retry', () => {
    renderWithProviders(<QueryError title="Failed" />);

    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});
