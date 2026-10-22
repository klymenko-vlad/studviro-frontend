import type { $ZodRawIssue } from 'zod/v4/core';

/**
 * Keys of the `validation` namespace. Kept as a union so a message this module
 * asks for and a message the catalogue carries cannot drift apart.
 */
export type ValidationMessageKey =
  | 'required'
  | 'tooShort'
  | 'tooLong'
  | 'exactLength'
  | 'numberTooSmall'
  | 'numberTooBig'
  | 'dateTooEarly'
  | 'dateTooLate'
  | 'selectOne'
  | 'tooFewItems'
  | 'tooManyItems'
  | 'fileTooLarge'
  | 'email'
  | 'url'
  | 'option'
  | 'identifier'
  | 'datetime'
  | 'date'
  | 'time'
  | 'pattern'
  | 'startsWith'
  | 'endsWith'
  | 'includes'
  | 'number'
  | 'integer'
  | 'multipleOf'
  | 'invalid';

export type ValidationTranslator = (
  key: ValidationMessageKey,
  values?: Record<string, number | string>,
) => string;

const ID_FORMATS = new Set(['uuid', 'guid', 'nanoid', 'cuid', 'cuid2', 'ulid']);

function formatMessage(
  issue: Extract<$ZodRawIssue, { code: 'invalid_format' }>,
  t: ValidationTranslator,
): string {
  const { format } = issue;

  if (ID_FORMATS.has(format)) return t('identifier');

  switch (format) {
    case 'email':
      return t('email');
    case 'url':
      return t('url');
    case 'datetime':
      return t('datetime');
    case 'date':
      return t('date');
    case 'time':
      return t('time');
    case 'starts_with':
      return t('startsWith', { prefix: String(issue['prefix']) });
    case 'ends_with':
      return t('endsWith', { suffix: String(issue['suffix']) });
    case 'includes':
      return t('includes', { text: String(issue['includes']) });
    default:
      return t('pattern');
  }
}

function tooSmallMessage(
  issue: Extract<$ZodRawIssue, { code: 'too_small' }>,
  t: ValidationTranslator,
): string {
  const minimum = Number(issue.minimum);

  switch (issue.origin) {
    case 'string':
      if (minimum <= 1) return t('required');
      return issue.exact === true
        ? t('exactLength', { length: minimum })
        : t('tooShort', { min: minimum });
    case 'array':
    case 'set':
      return minimum <= 1 ? t('selectOne') : t('tooFewItems', { min: minimum });
    case 'date':
      return t('dateTooEarly');
    default:
      return t('numberTooSmall', { min: minimum });
  }
}

function tooBigMessage(
  issue: Extract<$ZodRawIssue, { code: 'too_big' }>,
  t: ValidationTranslator,
): string {
  const maximum = Number(issue.maximum);

  switch (issue.origin) {
    case 'string':
      return issue.exact === true
        ? t('exactLength', { length: maximum })
        : t('tooLong', { max: maximum });
    case 'array':
    case 'set':
      return t('tooManyItems', { max: maximum });
    case 'date':
      return t('dateTooLate');
    case 'file':
      return t('fileTooLarge');
    default:
      return t('numberTooBig', { max: maximum });
  }
}

function typeMessage(expected: string, t: ValidationTranslator): string {
  switch (expected) {
    case 'number':
      return t('number');
    case 'int':
    case 'bigint':
      return t('integer');
    case 'date':
      return t('date');
    case 'array':
    case 'set':
      return t('selectOne');
    default:
      return t('invalid');
  }
}

/**
 * Turns a Zod issue into a sentence a person can act on.
 *
 * Zod's own text ("Too small: expected string to have >=1 characters") describes
 * the schema, not what the reader should do about it, and it cannot be
 * translated. Nothing here restates a rule — the numbers all come from the
 * issue, so a constraint the backend changes changes the message with it.
 *
 * Returns `undefined` when the issue already carries its own message, so a
 * `.refine()` that says something specific keeps saying it.
 */
export function validationMessage(
  issue: $ZodRawIssue,
  t: ValidationTranslator,
): string | undefined {
  if (typeof issue.message === 'string' && issue.message.length > 0) return undefined;

  switch (issue.code) {
    case 'invalid_type':
      return issue.input === undefined || issue.input === null
        ? t('required')
        : typeMessage(issue.expected, t);
    case 'too_small':
      return tooSmallMessage(issue, t);
    case 'too_big':
      return tooBigMessage(issue, t);
    case 'invalid_format':
      return formatMessage(issue, t);
    case 'invalid_value':
      return t('option');
    case 'not_multiple_of':
      return t('multipleOf', { step: issue.divisor });
    default:
      return t('invalid');
  }
}
