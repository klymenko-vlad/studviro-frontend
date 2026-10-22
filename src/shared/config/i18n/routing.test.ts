import { describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, isAppLocale, LOCALES, negotiateLocale } from './routing';

describe('isAppLocale', () => {
  it.each([...LOCALES])('accepts %s', locale => {
    expect(isAppLocale(locale)).toBe(true);
  });

  it.each([['de'], ['EN'], [''], ['en-GB']])('rejects %j', value => {
    expect(isAppLocale(value)).toBe(false);
  });

  it('rejects a non-string, since the value comes from a cookie', () => {
    expect(isAppLocale(undefined)).toBe(false);
    expect(isAppLocale(null)).toBe(false);
    expect(isAppLocale(['sk'])).toBe(false);
  });
});

describe('negotiateLocale', () => {
  it('falls back to the default when the header is absent', () => {
    expect(negotiateLocale(null)).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale('')).toBe(DEFAULT_LOCALE);
  });

  it('matches a bare tag', () => {
    expect(negotiateLocale('sk')).toBe('sk');
  });

  it('matches on the primary subtag, so a region does not defeat it', () => {
    expect(negotiateLocale('sk-SK')).toBe('sk');
    expect(negotiateLocale('en-GB,en;q=0.9')).toBe('en');
  });

  it('is case-insensitive', () => {
    expect(negotiateLocale('SK-sk')).toBe('sk');
  });

  it('honours quality order rather than written order', () => {
    expect(negotiateLocale('en;q=0.2, sk;q=0.9')).toBe('sk');
  });

  it('treats an omitted q as the highest preference', () => {
    expect(negotiateLocale('sk, en;q=0.9')).toBe('sk');
  });

  it('skips languages it does not support', () => {
    expect(negotiateLocale('de-DE,fr;q=0.8,sk;q=0.3')).toBe('sk');
  });

  it('falls back when nothing is supported', () => {
    expect(negotiateLocale('de-DE,fr;q=0.8')).toBe(DEFAULT_LOCALE);
  });

  it('does not let a malformed q outrank a real preference', () => {
    // `Number('abc')` is NaN, which sorts unpredictably and would otherwise be
    // able to win the comparison against a legitimate 0.9.
    expect(negotiateLocale('en;q=abc, sk;q=0.9')).toBe('sk');
  });

  it('ignores a wildcard rather than treating it as a match', () => {
    expect(negotiateLocale('*')).toBe(DEFAULT_LOCALE);
  });

  it('survives whitespace and empty segments', () => {
    expect(negotiateLocale('  ,  sk ;  q=0.8  , ')).toBe('sk');
  });
});
