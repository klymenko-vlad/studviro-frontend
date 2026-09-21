interface ProbeableSchema {
  safeParse: (value: unknown) => {
    success: boolean;
    error?: { issues: readonly { path: PropertyKey[] }[] } | undefined;
  };
}

function failingPaths(schema: ProbeableSchema, value: unknown): Set<string> {
  const result = schema.safeParse(value);
  const paths = new Set<string>();

  for (const issue of result.error?.issues ?? []) {
    if (issue.path.length > 0) paths.add(issue.path.map(String).join('.'));
  }

  return paths;
}

/**
 * The top-level fields a submission cannot leave empty, asked of the schema
 * itself rather than listed by hand — a `required` prop per field would be a
 * second copy of the backend's rules, free to disagree with them.
 *
 * Two probes, because "the key must be present" and "the value may not be
 * blank" are different questions: an empty object finds every non-optional
 * field, and an empty string for each of those drops the ones that accept one
 * anyway. A field only earns the mark when it fails both.
 */
export function requiredFieldNames(schema: ProbeableSchema): ReadonlySet<string> {
  const missing = failingPaths(schema, {});

  if (missing.size === 0) return missing;

  const blank: Record<string, string> = {};
  for (const path of missing) {
    if (!path.includes('.')) blank[path] = '';
  }

  const blankRejected = failingPaths(schema, blank);

  return new Set([...missing].filter(path => blankRejected.has(path)));
}
