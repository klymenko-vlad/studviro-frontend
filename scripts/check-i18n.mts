/**
 * Message catalogue parity check.
 *
 * `createMessagesDeclaration` in next.config.ts types the *keys* against
 * `messages/en.json`, so `t('nope')` is already a compile error. What it cannot
 * see is a key that exists in `en.json` and is missing from `uk.json` — that
 * falls back to the English string at runtime and ships silently.
 *
 * This closes that gap, in both directions, and flags empty values.
 *
 *   pnpm i18n:check
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const MESSAGES_DIR = join(import.meta.dirname, '..', 'messages');

/** The catalogue every other one is compared against. */
const REFERENCE_LOCALE = 'en';

type Catalogue = Record<string, unknown>;

/**
 * Flattens to dotted paths so `common.appName` is comparable across files
 * regardless of how the objects are nested.
 */
function flatten(value: unknown, prefix = ''): Map<string, unknown> {
  const result = new Map<string, unknown>();

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    result.set(prefix, value);
    return result;
  }

  for (const [key, nested] of Object.entries(value as Catalogue)) {
    const path = prefix ? `${prefix}.${key}` : key;
    for (const [flatKey, flatValue] of flatten(nested, path)) {
      result.set(flatKey, flatValue);
    }
  }

  return result;
}

async function readCatalogue(locale: string): Promise<Map<string, unknown>> {
  const raw = await readFile(join(MESSAGES_DIR, `${locale}.json`), 'utf8');
  return flatten(JSON.parse(raw));
}

function report(locale: string, label: string, keys: string[]): number {
  if (keys.length === 0) return 0;

  console.error(`\n  ${locale}.json — ${label} (${keys.length}):`);
  for (const key of keys.toSorted()) console.error(`    ${key}`);

  return keys.length;
}

async function main(): Promise<void> {
  const files = await readdir(MESSAGES_DIR);
  const locales = files
    // `.d.json.ts` declaration files live here too; only real catalogues count.
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace(/\.json$/, ''));

  if (!locales.includes(REFERENCE_LOCALE)) {
    console.error(`✗ Reference catalogue messages/${REFERENCE_LOCALE}.json is missing.`);
    process.exit(1);
  }

  const reference = await readCatalogue(REFERENCE_LOCALE);
  const referenceKeys = new Set(reference.keys());

  let problems = 0;

  for (const locale of locales.filter(candidate => candidate !== REFERENCE_LOCALE)) {
    const catalogue = await readCatalogue(locale);
    const keys = new Set(catalogue.keys());

    problems += report(
      locale,
      `missing keys (present in ${REFERENCE_LOCALE})`,
      [...referenceKeys].filter(key => !keys.has(key)),
    );

    problems += report(
      locale,
      `orphaned keys (absent from ${REFERENCE_LOCALE})`,
      [...keys].filter(key => !referenceKeys.has(key)),
    );

    // An empty string type-checks and renders as nothing — worse than missing,
    // because the fallback never kicks in.
    problems += report(
      locale,
      'empty values',
      [...catalogue].filter(([, value]) => value === '').map(([key]) => key),
    );
  }

  problems += report(
    REFERENCE_LOCALE,
    'empty values',
    [...reference].filter(([, value]) => value === '').map(([key]) => key),
  );

  if (problems > 0) {
    console.error(`\n✗ ${problems} i18n problem(s) across ${locales.length} catalogues.`);
    process.exit(1);
  }

  console.log(
    `✓ ${locales.length} catalogues in sync (${referenceKeys.size} keys each).`,
  );
}

await main();
