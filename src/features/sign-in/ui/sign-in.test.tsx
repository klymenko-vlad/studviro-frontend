import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import {
  errorResponse,
  renderWithProviders,
  screen,
  server,
  session,
} from '@/shared/test';

import { SignIn } from './sign-in';

const push = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());

vi.mock('@/shared/config', async importOriginal => ({
  ...(await importOriginal<typeof SharedConfig>()),
  useRouter: () => ({ push, refresh }),
}));

async function signIn(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText('Password'), 'correct-horse-battery');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('SignIn', () => {
  it('labels every input so it is reachable by name', () => {
    renderWithProviders(<SignIn />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('never exposes a token to the page on success', async () => {
    const { user, container } = renderWithProviders(<SignIn />);

    await signIn(user);
    await screen.findByLabelText('Email');

    // The BFF answers with the user only; the tokens stay in httpOnly cookies.
    // A token reaching the DOM would mean the whole BFF indirection bought
    // nothing.
    expect(container.textContent).not.toContain(session.accessToken);
    expect(document.cookie).not.toContain(session.refreshToken);
  });

  it('refreshes the router before navigating, so the next page is not the signed-out tree', async () => {
    const { user } = renderWithProviders(<SignIn />);

    await signIn(user);

    await vi.waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    // The account page, not home: a signed-in user landing back on the
    // marketing page has to work out where to go next by themselves.
    expect(push).toHaveBeenCalledWith('/account');
  });

  it('honours an explicit destination', async () => {
    const { user } = renderWithProviders(<SignIn next="/dashboard/courses" />);

    await signIn(user);

    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/dashboard/courses');
    });
  });

  it('reports a rejected sign-in without saying which half was wrong', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(errorResponse(401, 'Invalid credentials', 'Unauthorized'), {
          status: 401,
        }),
      ),
    );

    const { user } = renderWithProviders(<SignIn />);
    await signIn(user);

    const message = await screen.findByText(
      'That email and password do not match an account.',
    );
    expect(message).toBeInTheDocument();
    expect(push).not.toHaveBeenCalledWith('/dashboard');
  });

  it('rejects a malformed email before sending anything', async () => {
    const { user } = renderWithProviders(<SignIn />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'whatever');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
