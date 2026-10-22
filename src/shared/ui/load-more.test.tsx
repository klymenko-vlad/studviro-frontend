import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test';

import { LoadMore } from './load-more';

describe('LoadMore', () => {
  it('says how much of the list has arrived', () => {
    renderWithProviders(<LoadMore shown={100} hasMore onLoadMore={vi.fn()} />);

    expect(screen.getByText('100 shown')).toBeInTheDocument();
  });

  it('asks for the next page when pressed', async () => {
    const onLoadMore = vi.fn();
    const { user } = renderWithProviders(
      <LoadMore shown={100} hasMore onLoadMore={onLoadMore} />,
    );

    await user.click(screen.getByRole('button', { name: 'Load more' }));

    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('offers nothing to press once the list is complete', () => {
    renderWithProviders(<LoadMore shown={42} hasMore={false} onLoadMore={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(screen.getByText('42 shown')).toBeInTheDocument();
  });

  it('cannot be pressed twice while a page is in flight', () => {
    renderWithProviders(<LoadMore shown={100} hasMore pending onLoadMore={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Load more' })).toBeDisabled();
  });

  it('does not announce a count nobody asked for, and does once they have', async () => {
    const { user, rerender } = renderWithProviders(
      <LoadMore shown={50} hasMore onLoadMore={vi.fn()} />,
    );

    expect(screen.getByText('50 shown').getAttribute('aria-live')).toBe('off');

    await user.click(screen.getByRole('button', { name: 'Load more' }));
    rerender(<LoadMore shown={100} hasMore onLoadMore={vi.fn()} />);

    expect(screen.getByText('100 shown').getAttribute('aria-live')).toBe('polite');
  });
});
