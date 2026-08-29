import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { SignUp } from './sign-up';

const REGISTER = '/api/auth/register';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => router,
}));

async function fillValidForm(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(screen.getByLabelText('Display name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText('Password'), 'correct-horse-battery');
  await user.type(screen.getByLabelText('Confirm password'), 'correct-horse-battery');
}

describe('SignUp', () => {
  it('labels every input so it is reachable by name', () => {
    renderWithProviders(<SignUp />);

    expect(screen.getByLabelText('Display name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('blocks submission and announces an error for an invalid email', async () => {
    const { user } = renderWithProviders(<SignUp />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('sends the account onward once registration succeeds', async () => {
    router.push.mockClear();
    server.use(
      http.post(REGISTER, () =>
        HttpResponse.json({ user: { id: 'u1', email: 'ada@example.com' } }),
      ),
    );

    const { user } = renderWithProviders(<SignUp />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    // Registration signs you in, so it must land somewhere useful rather than
    // returning to a form the new session would immediately redirect away from.
    await vi.waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/account');
    });
  });

  it('honours an explicit destination over the default landing page', async () => {
    router.push.mockClear();
    server.use(
      http.post(REGISTER, () =>
        HttpResponse.json({ user: { id: 'u1', email: 'ada@example.com' } }),
      ),
    );

    const { user } = renderWithProviders(<SignUp next="/institutions/abc" />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    await vi.waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/institutions/abc');
    });
  });

  it('puts a taken email on the field rather than in a toast', async () => {
    server.use(
      http.post(REGISTER, () =>
        HttpResponse.json(errorResponse(409, 'Email already registered'), {
          status: 409,
        }),
      ),
    );

    const { user } = renderWithProviders(<SignUp />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument();
  });
});
