import { describe, expect, it } from 'vitest';

import { fromLocalInput, toLocalInput } from './local-input';

const BRATISLAVA = 'Europe/Bratislava';

describe('a datetime-local field on the institution’s clock', () => {
  it('shows an instant as the wall time in the zone', () => {
    expect(toLocalInput('2026-11-16T22:59:00.000Z', BRATISLAVA)).toBe('2026-11-16T23:59');
  });

  it('shows no instant as an empty field', () => {
    expect(toLocalInput(null, BRATISLAVA)).toBe('');
  });

  it('reads a typed wall time back as the instant it means there', () => {
    expect(fromLocalInput('2026-11-02T08:00', BRATISLAVA)).toBe(
      '2026-11-02T07:00:00.000Z',
    );
  });

  it('reads an empty field as no instant', () => {
    expect(fromLocalInput('', BRATISLAVA)).toBeNull();
  });
});
