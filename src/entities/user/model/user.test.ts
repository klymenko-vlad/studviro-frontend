import { describe, expect, it } from 'vitest';

import { getUserInitials } from './user';

describe('getUserInitials', () => {
  it('takes the first and last word of a display name', () => {
    expect(getUserInitials({ displayName: 'Ada Lovelace', email: 'a@b.c' })).toBe('AL');
    expect(getUserInitials({ displayName: 'Ada Byron Lovelace', email: 'a@b.c' })).toBe(
      'AL',
    );
  });

  it('takes two letters from a single-word name', () => {
    expect(getUserInitials({ displayName: 'Ada', email: 'a@b.c' })).toBe('AD');
  });

  it('falls back to the email when the display name is blank', () => {
    expect(getUserInitials({ displayName: '   ', email: 'ada@example.com' })).toBe('AD');
  });

  it('collapses extra whitespace', () => {
    expect(getUserInitials({ displayName: '  Ada   Lovelace  ', email: 'a@b.c' })).toBe(
      'AL',
    );
  });

  it('returns a placeholder when there is nothing to work with', () => {
    expect(getUserInitials({ displayName: '', email: '' })).toBe('?');
  });
});
