import { describe, expect, it } from 'vitest';

import { sectionFormSchema, toSectionPayload } from './schema';

describe('sectionFormSchema', () => {
  it('accepts a title with no summary', () => {
    expect(sectionFormSchema.safeParse({ title: 'Week 1', summary: '' }).success).toBe(
      true,
    );
  });

  it('refuses an empty or blank title', () => {
    for (const title of ['', '   ']) {
      expect(sectionFormSchema.safeParse({ title, summary: '' }).success).toBe(false);
    }
  });

  it('refuses a title past 200 characters', () => {
    expect(
      sectionFormSchema.safeParse({ title: 'x'.repeat(201), summary: '' }).success,
    ).toBe(false);
  });
});

describe('toSectionPayload', () => {
  it('trims, and sends a blank summary as none', () => {
    expect(toSectionPayload({ title: '  Week 1 ', summary: '  ' })).toEqual({
      title: 'Week 1',
      summary: null,
    });
  });
});
