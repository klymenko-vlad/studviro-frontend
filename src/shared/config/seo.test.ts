import { describe, expect, it } from 'vitest';

import { LOCALES } from './i18n/routing';
import { OG_LOCALES } from './seo';

describe('OG_LOCALES', () => {
  // A locale added to the app without an Open Graph tag would render
  // `undefined` into the page metadata.
  it('covers every supported locale', () => {
    expect(Object.keys(OG_LOCALES).toSorted()).toEqual([...LOCALES].toSorted());
  });
});
