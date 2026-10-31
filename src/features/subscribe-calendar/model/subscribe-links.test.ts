import { describe, expect, it } from 'vitest';

import { subscribeLinks } from './subscribe-links';

const FEED = 'https://api.example.org/api/v1/calendar-feeds/secret-token.ics';
const WEBCAL = 'webcal://api.example.org/api/v1/calendar-feeds/secret-token.ics';

describe('subscribeLinks', () => {
  it('hands Apple and any other calendar app the feed as webcal', () => {
    expect(subscribeLinks(FEED).apple).toBe(WEBCAL);
  });

  it('asks Google Calendar to subscribe to the webcal address', () => {
    const google = new URL(subscribeLinks(FEED).google);

    expect(google.origin + google.pathname).toBe(
      'https://calendar.google.com/calendar/r',
    );
    expect(google.searchParams.get('cid')).toBe(WEBCAL);
  });

  it('asks Outlook.com and Microsoft 365 to add the https feed from the web', () => {
    const { outlook, office } = subscribeLinks(FEED);

    for (const [link, origin] of [
      [outlook, 'https://outlook.live.com'],
      [office, 'https://outlook.office.com'],
    ] as const) {
      const url = new URL(link);
      expect(url.origin).toBe(origin);
      expect(url.pathname).toBe('/calendar/0/addfromweb');
      expect(url.searchParams.get('url')).toBe(FEED);
      expect(url.searchParams.get('name')).toBe('StudViro');
    }
  });

  it('keeps the plain-http scheme of a development feed out of the webcal address', () => {
    expect(
      subscribeLinks('http://localhost:3300/api/v1/calendar-feeds/t.ics').apple,
    ).toBe('webcal://localhost:3300/api/v1/calendar-feeds/t.ics');
  });
});
