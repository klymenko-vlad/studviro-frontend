import { describe, expect, it } from 'vitest';

import { buildSignUpSchema } from './sign-up';

const schema = buildSignUpSchema({ passwordMismatch: 'Passwords do not match' });

const valid = {
  email: 'ada@example.com',
  displayName: 'Ada Lovelace',
  password: 'correct-horse-battery',
  confirmPassword: 'correct-horse-battery',
};

describe('signUpSchema', () => {
  it('accepts a well-formed submission', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(schema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('inherits the password length rule from the generated API schema', () => {
    // The backend requires 8 characters; this must fail without us restating it.
    const result = schema.safeParse({
      ...valid,
      password: 'short',
      confirmPassword: 'short',
    });

    expect(result.success).toBe(false);
  });

  it('reports a mismatch against the confirmation field', () => {
    const result = schema.safeParse({ ...valid, confirmPassword: 'something-else' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword']);
    expect(result.error?.issues[0]?.message).toBe('Passwords do not match');
  });

  it('rejects a display name beyond the generated maximum', () => {
    expect(schema.safeParse({ ...valid, displayName: 'x'.repeat(121) }).success).toBe(
      false,
    );
  });
});
