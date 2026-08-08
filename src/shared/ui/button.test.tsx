import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test/render';

import { Button } from './button';

describe('Button', () => {
  it('renders its label as an accessible button', () => {
    renderWithProviders(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('defaults to type="button" so it cannot accidentally submit a form', () => {
    renderWithProviders(<Button>Save</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('calls onClick when activated', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is not activatable while disabled', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('lets a caller override a conflicting utility class', () => {
    renderWithProviders(<Button className="h-20">Save</Button>);

    // The default size sets h-9; tailwind-merge must let the caller's h-20 win.
    expect(screen.getByRole('button').className).toContain('h-20');
    expect(screen.getByRole('button').className).not.toContain('h-9');
  });

  it('renders as the child element when asChild is set', () => {
    renderWithProviders(
      <Button asChild>
        <a href="/dashboard">Dashboard</a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Dashboard' });
    expect(link).toHaveAttribute('href', '/dashboard');
    // A nested <a> inside <button> would be invalid HTML and unusable via keyboard.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
