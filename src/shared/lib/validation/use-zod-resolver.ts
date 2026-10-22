'use client';

import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { FieldValues, Resolver } from 'react-hook-form';
import type { $ZodRawIssue, input, output } from 'zod/v4/core';

import { validationMessage, type ValidationTranslator } from './validation-message';

interface ZodFormSchema<Output, Input> {
  _zod: { output: Output; input: Input };
}

/**
 * `zodResolver`, with every message the reader sees coming from the catalogue
 * rather than from Zod's English internals.
 *
 * Use it in place of `zodResolver` in every form: the schemas are generated from
 * the backend's OpenAPI document and carry no messages of their own, so this is
 * the only place a validation string can be written once for all of them.
 */
export function useZodResolver<
  Output extends FieldValues,
  Input extends FieldValues,
  Schema extends ZodFormSchema<Output, Input>,
>(schema: Schema): Resolver<input<Schema>, unknown, output<Schema>> {
  const t = useTranslations('validation');

  return useMemo(
    () =>
      zodResolver<Input, unknown, Output, Schema>(schema, {
        error: (issue: $ZodRawIssue) =>
          validationMessage(issue, t as ValidationTranslator),
      }),
    [schema, t],
  );
}
