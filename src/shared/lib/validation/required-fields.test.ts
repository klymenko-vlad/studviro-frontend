import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { requiredFieldNames } from './required-fields';

describe('requiredFieldNames', () => {
  it('marks a field that may not be blank', () => {
    const schema = z.object({ name: z.string().min(1) });

    expect([...requiredFieldNames(schema)]).toEqual(['name']);
  });

  it('leaves an optional field unmarked', () => {
    const schema = z.object({ name: z.string().min(1), note: z.string().optional() });

    expect([...requiredFieldNames(schema)]).toEqual(['name']);
  });

  it('leaves a field that accepts an empty string unmarked', () => {
    const schema = z.object({ note: z.string() });

    expect([...requiredFieldNames(schema)]).toEqual([]);
  });

  it('marks a field whose type rules out an empty value', () => {
    const schema = z.object({ capacity: z.number() });

    expect([...requiredFieldNames(schema)]).toEqual(['capacity']);
  });

  it('marks a field with a default the form still has to fill', () => {
    const schema = z.object({ email: z.email() });

    expect([...requiredFieldNames(schema)]).toEqual(['email']);
  });

  it('returns nothing for a schema that rejects nothing', () => {
    expect([...requiredFieldNames(z.object({}))]).toEqual([]);
  });
});
