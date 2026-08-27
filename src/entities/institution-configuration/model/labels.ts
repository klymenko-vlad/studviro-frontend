/**
 * The server decides which terminology keys and feature flags exist; this is
 * only the list the catalogue has wording for. Anything the server adds before
 * a translation lands still renders, under its own key.
 */
const TERMINOLOGY_LABEL_KEYS = [
  'academicTerm',
  'course',
  'courseOffering',
  'credits',
  'department',
  'faculty',
  'institution',
  'program',
  'student',
  'studentIdentifier',
  'teacher',
] as const;

const FEATURE_LABEL_KEYS = [
  'accommodation',
  'courseRegistration',
  'examRegistration',
  'fees',
  'grades',
  'thesis',
  'timetable',
] as const;

type TerminologyLabelKey = (typeof TERMINOLOGY_LABEL_KEYS)[number];
type FeatureLabelKey = (typeof FEATURE_LABEL_KEYS)[number];

export function isTerminologyLabelKey(key: string): key is TerminologyLabelKey {
  return (TERMINOLOGY_LABEL_KEYS as readonly string[]).includes(key);
}

export function isFeatureLabelKey(key: string): key is FeatureLabelKey {
  return (FEATURE_LABEL_KEYS as readonly string[]).includes(key);
}
