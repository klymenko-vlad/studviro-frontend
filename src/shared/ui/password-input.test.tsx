import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/shared/test/render';

import { PasswordInput } from './password-input';

describe('PasswordInput', () => {
  it('masks the value until the toggle is used', () => {
    renderWithProviders(<PasswordInput aria-label="Password" />);

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('reveals and re-masks the value, keeping what was typed', async () => {
    const { user } = renderWithProviders(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText('Password');

    await user.type(input, 'correct horse battery');
    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('correct horse battery');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));

    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveValue('correct horse battery');
  });

  it('does not submit the surrounding form', () => {
    renderWithProviders(<PasswordInput aria-label="Password" />);

    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('is unusable while the field is disabled', () => {
    renderWithProviders(<PasswordInput aria-label="Password" disabled />);

    expect(screen.getByRole('button', { name: 'Show password' })).toBeDisabled();
  });
});
