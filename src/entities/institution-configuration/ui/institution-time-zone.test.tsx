import { http, HttpResponse } from 'msw';
import { useFormatter } from 'next-intl';
import { describe, expect, it } from 'vitest';

import {
  institutionConfiguration,
  renderWithProviders,
  screen,
  server,
} from '@/shared/test';

import { InstitutionTimeZone } from './institution-time-zone';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const DETAIL_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/configuration`;
const NINE_UTC = new Date('2026-11-10T09:00:00.000Z');

function Clock() {
  const format = useFormatter();

  return (
    <p>
      {format.dateTime(NINE_UTC, {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })}
    </p>
  );
}

describe('InstitutionTimeZone', () => {
  it('shows times on the institution’s own clock', async () => {
    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json({
          ...institutionConfiguration,
          timezone: 'America/New_York',
        }),
      ),
    );

    renderWithProviders(
      <InstitutionTimeZone institutionId={INSTITUTION}>
        <Clock />
      </InstitutionTimeZone>,
    );

    expect(await screen.findByText('04:00')).toBeInTheDocument();
  });

  it('keeps the surrounding clock until the institution answers', () => {
    server.use(http.get(DETAIL_URL, () => new Promise(() => undefined)));

    renderWithProviders(
      <InstitutionTimeZone institutionId={INSTITUTION}>
        <Clock />
      </InstitutionTimeZone>,
    );

    // The test harness runs on Europe/Kyiv, two hours ahead of UTC in November.
    expect(screen.getByText('11:00')).toBeInTheDocument();
  });
});
