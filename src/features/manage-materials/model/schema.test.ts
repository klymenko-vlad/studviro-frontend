import { describe, expect, it } from 'vitest';

import {
  EMPTY_MATERIAL,
  materialEditSchema,
  materialFormSchema,
  toMaterialEdit,
  toMaterialPayload,
} from './schema';

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

  it('tracks nothing unless the author picks a completion rule', () => {
    const notes = {
      ...EMPTY_MATERIAL,
      kind: 'text' as const,
      title: 'Notes',
      body: 'Read this.',
    };

    expect(toMaterialPayload(notes, null, BRATISLAVA).completionRule).toBe('none');
    expect(
      toMaterialPayload({ ...notes, completionRule: 'viewed' }, null, BRATISLAVA)
        .completionRule,
    ).toBe('viewed');
  });

  it('refuses a rule a material cannot meet', () => {
    expect(
      materialFormSchema.safeParse({
        ...EMPTY_MATERIAL,
        kind: 'text',
        title: 'Notes',
        body: 'Read this.',
        completionRule: 'submitted',
      }).success,
    ).toBe(false);
  });

  it('sends a page’s body and a video’s address, and nothing a kind does not use', () => {
    const page = toMaterialPayload(
      { ...EMPTY_MATERIAL, kind: 'page', title: 'Guide', body: '# Hi', url: 'x' },
      null,
      BRATISLAVA,
    );
    expect(page).toMatchObject({ kind: 'page', body: '# Hi', url: null });

    const video = toMaterialPayload(
      {
        ...EMPTY_MATERIAL,
        kind: 'video',
        title: 'Talk',
        body: 'x',
        url: 'https://youtu.be/a',
      },
      null,
      BRATISLAVA,
    );
    expect(video).toMatchObject({ kind: 'video', body: null, url: 'https://youtu.be/a' });
  });

  it('sends a label with its text and no title, and never a completion rule', () => {
    const label = toMaterialPayload(
      {
        ...EMPTY_MATERIAL,
        kind: 'label',
        title: 'typed before switching',
        body: 'Part two',
        completionRule: 'viewed',
      },
      null,
      BRATISLAVA,
    );

    expect(label).toMatchObject({
      kind: 'label',
      body: 'Part two',
      completionRule: 'none',
    });
    expect(label).not.toHaveProperty('title');
  });

  it.each([
    ['page', { body: '' }],
    ['label', { body: '  ' }],
    ['label', { body: 'a'.repeat(1001) }],
    ['text', { body: 'a'.repeat(20_001) }],
    ['page', { body: 'a'.repeat(100_001) }],
    ['video', { url: '' }],
  ] as const)('refuses a %s missing what it is made of or too long', (kind, values) => {
    expect(
      materialFormSchema.safeParse({ ...EMPTY_MATERIAL, kind, title: 'T', ...values })
        .success,
    ).toBe(false);
  });

  it('needs a title on everything but a label', () => {
    expect(
      materialFormSchema.safeParse({ ...EMPTY_MATERIAL, kind: 'folder', title: '' })
        .success,
    ).toBe(false);
    expect(
      materialFormSchema.safeParse({
        ...EMPTY_MATERIAL,
        kind: 'label',
        title: '',
        body: 'Hi',
      }).success,
    ).toBe(true);
    expect(
      materialFormSchema.safeParse({
        ...EMPTY_MATERIAL,
        kind: 'page',
        title: '',
        body: 'Hi',
      }).success,
    ).toBe(false);
  });

  it('edits only the title and what the kind is made of', () => {
    const values = { title: 'New', body: 'B', url: 'https://youtu.be/x' };

    expect(toMaterialEdit('page', values)).toEqual({ title: 'New', body: 'B' });
    expect(toMaterialEdit('video', values)).toEqual({
      title: 'New',
      url: 'https://youtu.be/x',
    });
    expect(toMaterialEdit('label', values)).toEqual({ body: 'B' });
    expect(toMaterialEdit('folder', values)).toEqual({ title: 'New' });
    expect(
      materialEditSchema('label').safeParse({ title: '', body: '', url: '' }).success,
    ).toBe(false);
    expect(
      materialEditSchema('file').safeParse({ title: 'x', body: '', url: '' }).success,
    ).toBe(true);
  });
});
