import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import type * as SharedConfig from '@/shared/config';
import {
  captchaChallenge,
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

  it('shows the shape of each answer before anything is typed', () => {
    renderWithProviders(<SignIn />);

    // An empty box under a one-word label leaves the format to guesswork.
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'placeholder',
      'jana.kovacova@university.edu',
    );
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'placeholder',
      'Your password',
    );
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

  describe('when the deployment asks for a captcha', () => {
    it('solves it and sends the answer with the credentials', async () => {
      let body: Record<string, unknown> | undefined;
      server.use(
        http.post('/api/auth/login', async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;

          return HttpResponse.json({ user: session.user });
        }),
      );

      const { user } = renderWithProviders(<SignIn captchaEnabled />);
      await screen.findByTestId('captcha-notice');
      await signIn(user);

      await vi.waitFor(() => {
        expect(body).toBeDefined();
      });
      expect(body).toMatchObject({ email: 'ada@example.com' });
      expect(typeof body?.['captcha']).toBe('string');
      expect(
        JSON.parse(Buffer.from(String(body?.['captcha']), 'base64').toString('utf8')),
      ).toMatchObject({ challenge: captchaChallenge.challenge, number: 7 });
    });

    it('tells the person what is happening while their browser hashes', async () => {
      renderWithProviders(<SignIn captchaEnabled />);

      expect(await screen.findByTestId('captcha-notice')).toHaveTextContent(
        'This form is protected by a verification check your browser completes for you.',
      );
    });

    it('says so rather than submitting when the challenge cannot be fetched', async () => {
      server.use(
        http.post(
          '/api/proxy/api/v1/captcha/challenge',
          () => new HttpResponse(null, { status: 500 }),
        ),
      );
      let submitted = false;
      server.use(
        http.post('/api/auth/login', () => {
          submitted = true;

          return HttpResponse.json({ user: session.user });
        }),
      );

      const { user } = renderWithProviders(<SignIn captchaEnabled />);
      await screen.findByTestId('captcha-notice');
      await signIn(user);

      await vi.waitFor(() => {
        expect(screen.getByTestId('captcha-notice')).toHaveTextContent(
          'The verification check did not finish. Try again.',
        );
      });
      expect(submitted).toBe(false);
    });
  });

  it('shows no verification step at all when the deployment has none', async () => {
    renderWithProviders(<SignIn />);

    await screen.findByLabelText('Email');
    expect(screen.queryByTestId('captcha-notice')).not.toBeInTheDocument();
  });

  describe('when the account has two-step verification', () => {
    function challenge() {
      server.use(
        http.post('/api/auth/login', () =>
          HttpResponse.json(
            {
              ...errorResponse(401, 'Enter the code', 'Unauthorized'),
              code: 'TWO_FACTOR_REQUIRED',
            },
            { status: 401 },
          ),
        ),
      );
    }

    it('asks for the code instead of reporting a failure', async () => {
      challenge();
      const { user } = renderWithProviders(<SignIn />);

      await signIn(user);

      expect(await screen.findByLabelText('Authenticator code')).toBeInTheDocument();
      expect(
        screen.queryByText('That email and password do not match an account.'),
      ).not.toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    });

    it('signs in once the code is accepted', async () => {
      challenge();
      let sent: unknown;
      server.use(
        http.post('/api/auth/login/two-factor', async ({ request }) => {
          sent = await request.json();
          return HttpResponse.json({ user: session.user });
        }),
      );
      const { user } = renderWithProviders(<SignIn />);

      await signIn(user);
      await user.type(await screen.findByLabelText('Authenticator code'), '123456');
      await user.click(screen.getByRole('button', { name: 'Verify' }));

      await vi.waitFor(() => {
        expect(push).toHaveBeenCalledWith('/account');
      });
      expect(sent).toEqual({ code: '123456' });
    });

    it('says so when the code is wrong', async () => {
      challenge();
      server.use(
        http.post('/api/auth/login/two-factor', () =>
          HttpResponse.json(
            {
              ...errorResponse(401, 'That code is not valid'),
              code: 'TWO_FACTOR_CODE_INVALID',
            },
            { status: 401 },
          ),
        ),
      );
      const { user } = renderWithProviders(<SignIn />);

      await signIn(user);
      await user.type(await screen.findByLabelText('Authenticator code'), '000000');
      await user.click(screen.getByRole('button', { name: 'Verify' }));

      expect(
        await screen.findByText('That code is not valid. Check it and try again.'),
      ).toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    });

    it('offers a recovery code in place of the phone', async () => {
      challenge();
      const { user } = renderWithProviders(<SignIn />);

      await signIn(user);
      await user.click(
        await screen.findByRole('button', {
          name: 'Lost your phone? Use a recovery code',
        }),
      );

      expect(screen.getByLabelText('Recovery code')).toBeInTheDocument();
    });

    it('sends the person back to the password once the attempt has expired', async () => {
      challenge();
      server.use(
        http.post('/api/auth/login/two-factor', () =>
          HttpResponse.json(
            {
              ...errorResponse(401, 'Sign in again'),
              code: 'TWO_FACTOR_CHALLENGE_EXPIRED',
            },
            { status: 401 },
          ),
        ),
      );
      const { user } = renderWithProviders(<SignIn />);

      await signIn(user);
      await user.type(await screen.findByLabelText('Authenticator code'), '123456');
      await user.click(screen.getByRole('button', { name: 'Verify' }));
      await user.click(await screen.findByRole('button', { name: 'Sign in again' }));

      expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
      expect(screen.getByLabelText('Password')).toHaveValue('');
    });
  });
});
