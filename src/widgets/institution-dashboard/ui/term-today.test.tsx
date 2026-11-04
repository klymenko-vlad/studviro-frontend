import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen, server } from '@/shared/test';

import { TermToday } from './term-today';

const INSTITUTION = '55555555-5555-4555-8555-555555555555';
const TERMS_URL = `/api/proxy/api/v1/institutions/${INSTITUTION}/academic-terms`;

describe('TermToday', () => {
  it('gives the date and how far into the running term it falls', async () => {
    renderWithProviders(
      <TermToday institutionId={INSTITUTION} now={new Date('2026-10-22T10:00:00Z')} />,
    );

    expect(
      await screen.findByText(
        /Thursday, October 22 · Week 5 of 21 · Winter semester 2026\/2027/,
      ),
    ).toBeInTheDocument();
  });

  it('says when the next term starts between terms', async () => {
    renderWithProviders(
      <TermToday institutionId={INSTITUTION} now={new Date('2026-08-03T10:00:00Z')} />,
    );

    expect(
      await screen.findByText(
        /Monday, August 3 · Winter semester 2026\/2027 starts Sep 21, 2026/,
      ),
    ).toBeInTheDocument();
  });

  it('falls back to the date alone when the terms cannot be read', async () => {
    server.use(http.get(TERMS_URL, () => HttpResponse.json([])));

    renderWithProviders(
      <TermToday institutionId={INSTITUTION} now={new Date('2026-08-03T10:00:00Z')} />,
    );

    expect(await screen.findByText('Monday, August 3')).toBeInTheDocument();
  });
});
