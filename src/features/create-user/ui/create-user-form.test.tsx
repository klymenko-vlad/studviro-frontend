import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { CreateUserForm } from './create-user-form';

/**
 * The browser reaches the API through the same-origin BFF, never the API host
 * directly — so that is the URL the interceptor has to match.
 */
const API = '/api/proxy/api/v1';

async function fillValidForm(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText('Display name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Password'), 'correct-horse-battery');
  await user.type(screen.getByLabelText('Confirm password'), 'correct-horse-battery');
}

describe('CreateUserForm', () => {
  it('labels every input so it is reachable by name', () => {
    renderWithProviders(<CreateUserForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Display name')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('blocks submission and announces an error for an invalid email', async () => {
    const { user } = renderWithProviders(<CreateUserForm />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('enforces the password length inherited from the API schema', async () => {
    const { user } = renderWithProviders(<CreateUserForm />);

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Display name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
  });

  it('submits a valid form and clears the fields', async () => {
    const { user } = renderWithProviders(<CreateUserForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    await expect
      .poll(() => screen.getByLabelText<HTMLInputElement>('Email').value)
      .toBe('');
  });

  it('shows a duplicate-email conflict on the field rather than as a toast', async () => {
    server.use(
      http.post(`${API}/users`, () =>
        HttpResponse.json(errorResponse(409, 'Email already registered', 'Conflict'), {
          status: 409,
        }),
      ),
    );

    const { user } = renderWithProviders(<CreateUserForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create user' }));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
});
