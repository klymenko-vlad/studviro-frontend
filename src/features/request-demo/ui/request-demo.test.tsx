import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { errorResponse, renderWithProviders, screen, server } from '@/shared/test';

import { RequestDemo } from './request-demo';

// No `Toaster` is mounted in a test tree, so the call is what there is to assert.
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const DEMO_REQUESTS = '*/demo-requests';

async function fillValidForm(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(screen.getByLabelText('Institution'), 'Comenius University');
  await user.type(screen.getByLabelText('Your name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Work email'), 'ada@university.edu');
  await user.type(screen.getByLabelText('Your role'), 'Vice-dean');
}

const submit = () => screen.getByRole('button', { name: 'Request a demo' });

describe('RequestDemo', () => {
  it('labels every field a visitor is meant to fill', () => {
    renderWithProviders(<RequestDemo />);

    expect(screen.getByLabelText('Institution')).toBeInTheDocument();
    expect(screen.getByLabelText('Your name')).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toBeInTheDocument();
    expect(screen.getByLabelText('Your role')).toBeInTheDocument();
    expect(screen.getByLabelText('Anything else')).toBeInTheDocument();
  });

  it('blocks submission and marks the field for an invalid email', async () => {
    const { user } = renderWithProviders(<RequestDemo />);

    await user.type(screen.getByLabelText('Work email'), 'not-an-email');
    await user.click(submit());

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(screen.getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('blocks submission when the institution is too short for the API to accept', async () => {
    const onSubmitted = vi.fn();
    const { user } = renderWithProviders(<RequestDemo onSubmitted={onSubmitted} />);

    await user.type(screen.getByLabelText('Institution'), 'C');
    await user.click(submit());

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('sends the request and clears the form once it is accepted', async () => {
    let received: unknown;
    server.use(
      http.post(DEMO_REQUESTS, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ status: 'accepted' }, { status: 202 });
      }),
    );

    const onSubmitted = vi.fn();
    const { user } = renderWithProviders(<RequestDemo onSubmitted={onSubmitted} />);
    await fillValidForm(user);
    await user.click(submit());

    await vi.waitFor(() => {
      expect(onSubmitted).toHaveBeenCalled();
    });
    expect(toast.success).toHaveBeenCalledWith(
      'Thank you — your request is in',
      expect.objectContaining({ description: expect.any(String) as string }),
    );
    expect(received).toMatchObject({
      institutionName: 'Comenius University',
      email: 'ada@university.edu',
    });
    expect(screen.getByLabelText('Institution')).toHaveValue('');
  });

  it('carries the honeypot so a bot filling every field is still accepted', () => {
    renderWithProviders(<RequestDemo />);

    // Hidden from sight and from assistive technology, but present in the DOM:
    // the trap only works on something that reads the DOM rather than the page.
    expect(screen.getByLabelText('Leave this field empty')).toBeInTheDocument();
  });

  it('tells a rate-limited visitor to wait rather than showing the API wording', async () => {
    server.use(
      http.post(DEMO_REQUESTS, () =>
        HttpResponse.json(errorResponse(429, 'ThrottlerException: Too Many Requests'), {
          status: 429,
        }),
      ),
    );

    const { user } = renderWithProviders(<RequestDemo />);
    await fillValidForm(user);
    await user.click(submit());

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'That is a few too many requests in a row. Try again in a minute.',
      );
    });
  });

  it('reports a server failure without losing what was typed', async () => {
    server.use(
      http.post(DEMO_REQUESTS, () =>
        HttpResponse.json(errorResponse(500, 'Boom'), { status: 500 }),
      ),
    );

    const { user } = renderWithProviders(<RequestDemo />);
    await fillValidForm(user);
    await user.click(submit());

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'We could not send that. Try again, or write to us directly.',
      );
    });
    expect(screen.getByLabelText('Institution')).toHaveValue('Comenius University');
  });
});
