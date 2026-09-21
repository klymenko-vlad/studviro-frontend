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

/**
 * Keys whose Slovak value is legitimately the English string.
 *
 * The translation pass used "sk equals en" to find what was left. That
 * heuristic cannot reach zero: a grade letter, a pure format string, a proper
 * noun, a room code and a word Slovak shares with English are all correct
 * *because* they are identical. Without this list the next person chases 57
 * keys that are already right.
 *
 * Add to it only when a value is identical on purpose. A key that is merely
 * not translated yet does not belong here.
 */
const IDENTICAL_BY_DESIGN = new Set([
  'academicTerms.kind.semester',
  'academicTerms.kind.trimester',
  'academicTerms.placeholder.academicYear',
  'academicTerms.range',
  'account.source.platform',
  'assignments.placeholder.maxPoints',
  'assignments.unset',
  'audit.changed',
  'auth.placeholder.displayName',
  'calendar.duration',
  'calendar.time',
  'calendar.week',
  'catalogue.courses.codePlaceholder',
  'catalogue.programs.codePlaceholder',
  'common.appName',
  'contact.placeholder.contactName',
  'courseOffering.termRange',
  'createInstitution.placeholder.code',
  'createUser.placeholder.displayName',
  'dashboard.grade.A',
  'dashboard.grade.B',
  'dashboard.grade.C',
  'dashboard.grade.D',
  'dashboard.grade.E',
  'dashboard.grade.FX',
  'examTermAdmin.when',
  'gradeEntry.grade.A',
  'gradeEntry.grade.B',
  'gradeEntry.grade.C',
  'gradeEntry.grade.D',
  'gradeEntry.grade.E',
  'gradeEntry.grade.FX',
  'grades.effectiveGrade',
  'grades.grade.A',
  'grades.grade.B',
  'grades.grade.C',
  'grades.grade.D',
  'grades.grade.E',
  'grades.grade.FX',
  'grades.none',
  'institutionSettings.placeholder.timezone',
  'invitation.placeholder.displayName',
  'learning.none',
  'learningSpace.placeholder.shortName',
  'locale.sk',
  'marketing.footer.rights',
  'marking.placeholder.points',
  'materials.field.body',
  'materials.kind.text',
  'materials.size',
  'nav.audit',
  'nav.menu',
  'orgUnits.placeholder.code',
  'programMembers.placeholder.studyYear',
  'rooms.placeholder.code',
  'studyGroups.placeholder.code',
  'timetableAdmin.slotWhen',
]);

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
  const untranslated = new Map<string, number>();

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

    untranslated.set(
      locale,
      [...catalogue].filter(
        ([key, value]) => !IDENTICAL_BY_DESIGN.has(key) && value === reference.get(key),
      ).length,
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

  // Not a failure: a partly translated catalogue ships and falls back to the
  // English string. It is reported so the size of the remaining pass is a
  // number somebody can see rather than a grep somebody has to invent.
  for (const [locale, count] of untranslated) {
    console.log(
      count === 0
        ? `✓ ${locale}.json fully translated.`
        : `· ${locale}.json — ${count} key(s) still carry the English string.`,
    );
  }
}

await main();
