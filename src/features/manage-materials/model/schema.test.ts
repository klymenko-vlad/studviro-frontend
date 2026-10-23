import { describe, expect, it } from 'vitest';

import { EMPTY_MATERIAL, materialFormSchema, toMaterialPayload } from './schema';

const BRATISLAVA = 'Europe/Bratislava';

describe('the material form', () => {
  it('sends a material with no window as always available', () => {
    expect(
      toMaterialPayload(
        { ...EMPTY_MATERIAL, kind: 'text', title: 'Notes', body: 'Read this.' },
        null,
        BRATISLAVA,
      ),
    ).toMatchObject({
      availableFrom: null,
      availableUntil: null,
      hiddenUntilAvailable: false,
    });
  });

  it('sends a window on the institution’s clock', () => {
    expect(
      toMaterialPayload(
        {
          ...EMPTY_MATERIAL,
          kind: 'text',
          title: 'Notes',
          body: 'Read this.',
          availableFrom: '2026-11-02T08:00',
          availableUntil: '2026-11-30T08:00',
        },
        null,
        BRATISLAVA,
        'section-1',
      ),
    ).toMatchObject({
      availableFrom: '2026-11-02T07:00:00.000Z',
      availableUntil: '2026-11-30T07:00:00.000Z',
      sectionId: 'section-1',
    });
  });

  it('refuses a window that closes before it opens', () => {
    expect(
      materialFormSchema.safeParse({
        ...EMPTY_MATERIAL,
        kind: 'text',
        title: 'Notes',
        body: 'Read this.',
        availableFrom: '2026-11-30T08:00',
        availableUntil: '2026-11-02T08:00',
      }).success,
    ).toBe(false);
  });
});
