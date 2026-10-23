import { describe, expect, it } from 'vitest';

import { EMPTY_SECTION, sectionFormSchema, toSectionPayload } from './schema';

const BRATISLAVA = 'Europe/Bratislava';

describe('sectionFormSchema', () => {
  it('accepts a title with no summary', () => {
    expect(
      sectionFormSchema.safeParse({ ...EMPTY_SECTION, title: 'Week 1' }).success,
    ).toBe(true);
  });

  it('refuses an empty or blank title', () => {
    for (const title of ['', '   ']) {
      expect(sectionFormSchema.safeParse({ ...EMPTY_SECTION, title }).success).toBe(
        false,
      );
    }
  });

  it('refuses a title past 200 characters', () => {
    expect(
      sectionFormSchema.safeParse({ ...EMPTY_SECTION, title: 'x'.repeat(201) }).success,
    ).toBe(false);
  });

  it('refuses a window that closes before it opens', () => {
    expect(
      sectionFormSchema.safeParse({
        ...EMPTY_SECTION,
        title: 'Week 1',
        availableFrom: '2026-11-09T08:00',
        availableUntil: '2026-11-02T08:00',
      }).success,
    ).toBe(false);
  });
});

describe('toSectionPayload', () => {
  it('trims, and sends a blank summary as none', () => {
    expect(
      toSectionPayload(
        { ...EMPTY_SECTION, title: '  Week 1 ', summary: '  ' },
        BRATISLAVA,
      ),
    ).toEqual({
      title: 'Week 1',
      summary: null,
      availableFrom: null,
      availableUntil: null,
      hiddenUntilAvailable: false,
    });
  });

  it('sends the window on the institution’s clock', () => {
    expect(
      toSectionPayload(
        {
          ...EMPTY_SECTION,
          title: 'Week 9',
          availableFrom: '2026-11-16T08:00',
          hiddenUntilAvailable: true,
        },
        BRATISLAVA,
      ),
    ).toMatchObject({
      availableFrom: '2026-11-16T07:00:00.000Z',
      hiddenUntilAvailable: true,
    });
  });
});
