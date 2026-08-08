/**
 * Feature-Sliced Design slice scaffolder.
 *
 *   pnpm gen:slice features/create-course
 *   pnpm gen:slice entities/course --segments model,api
 *
 * FSD conventions decay when every slice is hand-created — one person adds a
 * `helpers/` segment, another skips the `index.ts`, and Steiger only complains
 * after the fact. This emits the shape the rules already require.
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

/** Mirrors LAYERS in eslint.config.mjs; `app` and `shared` are not sliced. */
const SLICED_LAYERS = ['views', 'widgets', 'features', 'entities'] as const;

type Layer = (typeof SLICED_LAYERS)[number];

const DEFAULT_SEGMENTS = ['ui', 'model'] as const;

/** Steiger's `fsd/segments-by-purpose` rejects anything outside this set. */
const VALID_SEGMENTS = ['ui', 'model', 'api', 'lib', 'config'] as const;

const SRC = join(import.meta.dirname, '..', 'src');

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

/** `create-course` → `CreateCourse` */
function toPascalCase(value: string): string {
  return value
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/** `create-course` → `createCourse` */
function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

interface Args {
  layer: Layer;
  slice: string;
  segments: string[];
}

function parseArgs(argv: string[]): Args {
  const positional = argv.filter(arg => !arg.startsWith('--'));
  const target = positional[0];

  if (!target) {
    fail(
      'Usage: pnpm gen:slice <layer>/<slice> [--segments ui,model,api]\n' +
        `  layers: ${SLICED_LAYERS.join(', ')}`,
    );
  }

  const [layer, slice, ...rest] = target.split('/');

  if (rest.length > 0) fail(`Expected <layer>/<slice>, got "${target}".`);
  if (!layer || !SLICED_LAYERS.includes(layer as Layer)) {
    fail(`Unknown layer "${layer ?? ''}". Expected one of: ${SLICED_LAYERS.join(', ')}.`);
  }
  if (!slice) fail(`Missing slice name in "${target}".`);
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slice)) {
    fail(`Slice name "${slice}" must be kebab-case (e.g. create-course).`);
  }

  const segmentsFlag = argv.indexOf('--segments');
  const segments =
    segmentsFlag === -1
      ? [...DEFAULT_SEGMENTS]
      : (argv[segmentsFlag + 1]?.split(',').map(segment => segment.trim()) ?? []);

  if (segments.length === 0) fail('--segments was given with no value.');

  const invalid = segments.filter(
    segment => !VALID_SEGMENTS.includes(segment as (typeof VALID_SEGMENTS)[number]),
  );
  if (invalid.length > 0) {
    fail(
      `Invalid segment(s): ${invalid.join(', ')}. ` +
        `Steiger allows: ${VALID_SEGMENTS.join(', ')}.`,
    );
  }

  return { layer: layer as Layer, slice, segments };
}

function uiComponent(slice: string): string {
  const name = toPascalCase(slice);

  return `interface ${name}Props {
  className?: string;
}

export function ${name}({ className }: ${name}Props) {
  return <div className={className}>${name}</div>;
}
`;
}

function uiTest(slice: string): string {
  const name = toPascalCase(slice);

  return `import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { render } from '@/shared/test';

import { ${name} } from './${slice}';

describe('${name}', () => {
  it('renders', () => {
    render(<${name} />);

    // Query by role or label, never by class name or test id where a role exists.
    expect(screen.getByText('${name}')).toBeInTheDocument();
  });
});
`;
}

function modelFile(slice: string): string {
  return `/** Model layer for the ${slice} slice — state, selectors, derivations. */
export const ${toCamelCase(slice)}Placeholder = null;
`;
}

function apiFile(slice: string): string {
  return `/**
 * Query wrappers for the ${slice} slice.
 *
 * Build these on top of \`apiQueries.*\` from '@/shared/api' — never hand-write a
 * query key, or the generated ones and yours will drift.
 */
export {};
`;
}

function genericSegment(slice: string, segment: string): string {
  return `/** ${segment} segment for the ${slice} slice. */
export {};
`;
}

function publicApi(slice: string, segments: string[]): string {
  const lines = ['/**', ` * Public API of the ${slice} slice.`, ' *'];
  lines.push(
    ' * Everything importable from outside this slice is listed here. Deep imports',
    ' * are an ESLint error, so an export missing from this file is invisible.',
    ' */',
  );

  if (segments.includes('ui')) {
    lines.push(`export { ${toPascalCase(slice)} } from './ui/${slice}';`);
  } else {
    lines.push('export {};');
  }

  return lines.join('\n') + '\n';
}

async function main(): Promise<void> {
  const { layer, slice, segments } = parseArgs(process.argv.slice(2));

  const sliceDir = join(SRC, layer, slice);

  // `mkdir --recursive` succeeds on an existing directory, so check explicitly
  // rather than silently merging into someone else's slice.
  const existing = await readdir(sliceDir).catch(() => null);
  if (existing !== null) fail(`src/${layer}/${slice} already exists.`);

  const files: [path: string, contents: string][] = [
    [join(sliceDir, 'index.ts'), publicApi(slice, segments)],
  ];

  for (const segment of segments) {
    const dir = join(sliceDir, segment);

    if (segment === 'ui') {
      files.push(
        [join(dir, `${slice}.tsx`), uiComponent(slice)],
        // The test is generated alongside the code, per AGENTS.md.
        [join(dir, `${slice}.test.tsx`), uiTest(slice)],
      );
    } else if (segment === 'model') {
      files.push([join(dir, `${slice}.ts`), modelFile(slice)]);
    } else if (segment === 'api') {
      files.push([join(dir, `${slice}.api.ts`), apiFile(slice)]);
    } else {
      files.push([join(dir, `${slice}.ts`), genericSegment(slice, segment)]);
    }
  }

  for (const [path, contents] of files) {
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, contents, 'utf8');
  }

  console.log(`✓ Created src/${layer}/${slice}\n`);
  for (const [path] of files) {
    console.log(`    ${path.slice(join(SRC, '..').length + 1)}`);
  }
  console.log(
    '\n  Next: add the user-facing strings to messages/en.json and messages/uk.json,\n' +
      '  then run `pnpm arch` to confirm the slice satisfies the FSD rules.',
  );
}

await main();
