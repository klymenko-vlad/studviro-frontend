import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  AVAILABILITY_ORDER_ISSUE,
  availabilityFormShape,
  availabilityInOrder,
  EMPTY_AVAILABILITY,
  toAvailabilityPayload,
  toAvailabilityValues,
} from './availability-form';

const BRATISLAVA = 'Europe/Bratislava';
const schema = z
  .object(availabilityFormShape)
  .refine(availabilityInOrder, AVAILABILITY_ORDER_ISSUE);

describe('the availability fields of a form', () => {
  it('sends an empty window as always available', () => {
    expect(toAvailabilityPayload(EMPTY_AVAILABILITY, BRATISLAVA)).toEqual({
      availableFrom: null,
      availableUntil: null,
      hiddenUntilAvailable: false,
    });
  });

  it('sends the typed wall times as instants on the institution’s clock', () => {
    expect(
      toAvailabilityPayload(
        {
          availableFrom: '2026-11-02T08:00',
          availableUntil: '2026-12-01T00:00',
          hiddenUntilAvailable: true,
        },
        BRATISLAVA,
      ),
    ).toEqual({
      availableFrom: '2026-11-02T07:00:00.000Z',
      availableUntil: '2026-11-30T23:00:00.000Z',
      hiddenUntilAvailable: true,
    });
  });

  it('opens an existing item on the window it was given', () => {
    expect(
      toAvailabilityValues(
        {
          availableFrom: '2026-11-02T07:00:00.000Z',
          availableUntil: null,
          hiddenUntilAvailable: true,
        },
        BRATISLAVA,
      ),
    ).toEqual({
      availableFrom: '2026-11-02T08:00',
      availableUntil: '',
      hiddenUntilAvailable: true,
    });
  });

  it('accepts an open end on either side', () => {
    expect(schema.safeParse(EMPTY_AVAILABILITY).success).toBe(true);
    expect(
      schema.safeParse({ ...EMPTY_AVAILABILITY, availableFrom: '2026-11-02T08:00' })
        .success,
    ).toBe(true);
  });

  it('refuses a window that ends before, or as, it opens', () => {
    for (const availableUntil of ['2026-11-01T08:00', '2026-11-02T08:00']) {
      const result = schema.safeParse({
        ...EMPTY_AVAILABILITY,
        availableFrom: '2026-11-02T08:00',
        availableUntil,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(['availableUntil']);
    }
  });

  it('refuses something that is not a date and a time', () => {
    expect(
      schema.safeParse({ ...EMPTY_AVAILABILITY, availableFrom: 'next week' }).success,
    ).toBe(false);
  });
});
