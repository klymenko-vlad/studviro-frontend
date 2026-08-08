import { describe, expect, it } from 'vitest';

import { buildCreateUserFormSchema } from './schema';

const createUserFormSchema = buildCreateUserFormSchema({
  passwordMismatch: 'Passwords do not match',
});

const valid = {
  email: 'ada@example.com',
  displayName: 'Ada Lovelace',
  password: 'correct-horse-battery',
  confirmPassword: 'correct-horse-battery',
};

describe('createUserFormSchema', () => {
  it('accepts a well-formed submission', () => {
    expect(createUserFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    const result = createUserFormSchema.safeParse({ ...valid, email: 'not-an-email' });

    expect(result.success).toBe(false);
  });

  it('inherits the password length rule from the generated API schema', () => {
    // The backend requires 12 characters; this must fail without us restating it.
    const result = createUserFormSchema.safeParse({
      ...valid,
      password: 'short',
      confirmPassword: 'short',
    });

    expect(result.success).toBe(false);
  });

  it('reports a password mismatch against the confirmation field', () => {
    const result = createUserFormSchema.safeParse({
      ...valid,
      confirmPassword: 'something-else-entirely',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword']);
    // The message is the caller's, not the schema's — that is the whole reason
    // this is a factory.
    expect(result.error?.issues[0]?.message).toBe('Passwords do not match');
  });

  it('rejects a display name beyond the generated maximum', () => {
    const result = createUserFormSchema.safeParse({
      ...valid,
      displayName: 'x'.repeat(121),
    });

    expect(result.success).toBe(false);
  });
});
