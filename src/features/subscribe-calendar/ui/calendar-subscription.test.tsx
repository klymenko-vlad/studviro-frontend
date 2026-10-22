import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen, server, userEvent } from '@/shared/test';

import { CalendarSubscription } from './calendar-subscription';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const FEED_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/me/calendar-feed`;
const SUBSCRIPTION = 'https://api.example.org/api/v1/calendar-feeds/secret-token.ics';

const renderSubscription = () =>
  renderWithProviders(<CalendarSubscription institutionId={INSTITUTION} />);

describe('CalendarSubscription', () => {
  it('offers the calendar as a file to download', async () => {
    renderSubscription();

    const link = await screen.findByRole('link', { name: /Download \.ics/ });

    expect(link).toHaveAttribute(
      'href',
      `/api/proxy/api/v1/institutions/${INSTITUTION}/me/calendar.ics`,
    );
    expect(link).toHaveAttribute('download');
  });

  it('creates a subscription link and shows it once', async () => {
    let live = false;
    server.use(
      http.get(FEED_URL, () =>
        HttpResponse.json(
          live
            ? { active: true, createdAt: '2026-10-18T10:00:00.000Z' }
            : { active: false, createdAt: null },
        ),
      ),
      http.post(FEED_URL, () => {
        live = true;
        return HttpResponse.json(
          { url: SUBSCRIPTION, createdAt: '2026-10-18T10:00:00.000Z' },
          { status: 201 },
        );
      }),
    );

    renderSubscription();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Create subscription link' }),
    );

    expect(await screen.findByRole('textbox', { name: 'Subscription link' })).toHaveValue(
      SUBSCRIPTION,
    );
    expect(screen.getByText(/shown only now/)).toBeInTheDocument();
  });

  it('says a link is live without showing it again, and can replace or turn it off', async () => {
    server.use(
      http.get(FEED_URL, () =>
        HttpResponse.json({ active: true, createdAt: '2026-10-18T10:00:00.000Z' }),
      ),
    );

    renderSubscription();

    expect(await screen.findByText(/A subscription link is active/)).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Subscription link' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Replace link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Turn off' })).toBeInTheDocument();
  });

  it('turns the link off', async () => {
    let live = true;
    server.use(
      http.get(FEED_URL, () =>
        HttpResponse.json(
          live
            ? { active: true, createdAt: '2026-10-18T10:00:00.000Z' }
            : { active: false, createdAt: null },
        ),
      ),
      http.delete(FEED_URL, () => {
        live = false;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderSubscription();
    await userEvent.click(await screen.findByRole('button', { name: 'Turn off' }));

    expect(
      await screen.findByRole('button', { name: 'Create subscription link' }),
    ).toBeInTheDocument();
  });

  it('reports a failure to create the link', async () => {
    server.use(
      http.post(FEED_URL, () =>
        HttpResponse.json(
          { statusCode: 500, error: 'Internal Server Error', message: 'Boom' },
          { status: 500 },
        ),
      ),
    );

    renderSubscription();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Create subscription link' }),
    );

    expect(
      screen.queryByRole('textbox', { name: 'Subscription link' }),
    ).not.toBeInTheDocument();
  });
});
