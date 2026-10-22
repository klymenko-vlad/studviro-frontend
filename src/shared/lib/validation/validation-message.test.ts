import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { $ZodRawIssue } from 'zod/v4/core';

import { validationMessage, type ValidationTranslator } from './validation-message';

const t: ValidationTranslator = (key, values) =>
  values ? `${key}(${Object.values(values).join(',')})` : key;

/** Runs a real parse so the issues under test are the ones Zod actually emits. */
function messageFor(schema: z.ZodType, value: unknown): string | undefined {
  const messages: (string | undefined)[] = [];

  schema.safeParse(value, {
    error: (issue: $ZodRawIssue) => {
      messages.push(validationMessage(issue, t));
      return undefined;
    },
  });

  return messages[0];
}

describe('validationMessage', () => {
  it('asks for a value rather than reporting a length of zero', () => {
    expect(messageFor(z.string().min(1), '')).toBe('required');
  });

  it('treats a missing value as required', () => {
    expect(messageFor(z.object({ a: z.string() }), {})).toBe('required');
  });

  it('carries the real minimum into a length message', () => {
    expect(messageFor(z.string().min(2), 'a')).toBe('tooShort(2)');
  });

  it('carries the real maximum into a length message', () => {
    expect(messageFor(z.string().max(3), 'abcd')).toBe('tooLong(3)');
  });

  it('names the format for an email', () => {
    expect(messageFor(z.email(), 'nope')).toBe('email');
  });

  it('names the format for a url', () => {
    expect(messageFor(z.url(), 'nope')).toBe('url');
  });

  it('calls out an identifier that is not one', () => {
    expect(messageFor(z.uuid(), 'nope')).toBe('identifier');
  });

  it('asks for a choice for an enum', () => {
    expect(messageFor(z.enum(['a', 'b']), 'c')).toBe('option');
  });

  it('bounds a number in its own words', () => {
    expect(messageFor(z.number().min(1), 0)).toBe('numberTooSmall(1)');
    expect(messageFor(z.number().max(10), 11)).toBe('numberTooBig(10)');
  });

  it('asks for a number when the type is wrong', () => {
    expect(messageFor(z.number(), 'abc')).toBe('number');
  });

  it('asks for a selection when an array is empty', () => {
    expect(messageFor(z.array(z.string()).min(1), [])).toBe('selectOne');
  });

  it('leaves a message the schema supplied alone', () => {
    const schema = z
      .object({ a: z.string(), b: z.string() })
      .refine(v => v.a === v.b, { message: 'They must match', path: ['b'] });
    const result = schema.safeParse(
      { a: 'x', b: 'y' },
      { error: issue => validationMessage(issue, t) },
    );

    expect(result.error?.issues[0]?.message).toBe('They must match');
  });

  it('falls back to a readable sentence for an issue it does not model', () => {
    expect(
      messageFor(
        z.string().refine(() => false),
        'x',
      ),
    ).toBe('invalid');
  });
});
