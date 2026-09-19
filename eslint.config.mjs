import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import boundaries from 'eslint-plugin-boundaries';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * Feature-Sliced Design layers, ordered from the outside in. A layer may import
 * from any layer *below* it and never from one above or beside it — that single
 * rule is what stops a codebase from turning into a dependency hairball.
 *
 * Steiger (steiger.config.mjs) checks slice structure; this checks import direction,
 * so violations surface in the editor rather than only in a separate command.
 */
const LAYERS = ['app', 'views', 'widgets', 'features', 'entities', 'shared'];

/**
 * For each layer, the layers it may NOT reach: everything above it.
 *
 * Expressed as `disallow` on top of `default: 'allow'` rather than an allow-list,
 * because an allow-list also rejects every external package (npm imports have no
 * element type) and would ban `react` from `shared`.
 */
const forbiddenUpwardDependencies = LAYERS.slice(1).map((layer, index) => ({
  from: [{ type: layer }],
  disallow: LAYERS.slice(0, index + 1).map(target => ({ type: target })),
}));

export default defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'storybook-static/**',
    'next-env.d.ts',
    // Regenerated wholesale by `pnpm api:generate`; linting it is noise.
    'src/shared/api/generated/**',
  ]),

  js.configs.recommended,
  ...nextVitals,
  ...nextTs,

  /* Type-aware TypeScript rules. `projectService` lets typescript-eslint pick the
     right tsconfig per file without us maintaining a parser project list. */
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ['**/*.{ts,tsx,mts}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Server Components are async and `void`-returning event handlers are normal
      // in React; the blanket rule fires constantly on correct code.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      '@typescript-eslint/no-unnecessary-condition': [
        'error',
        // `noUncheckedIndexedAccess` makes array access legitimately nullable.
        { allowConstantLoopConditions: true },
      ],
      /**
       * Console output is unstructured, unfiltered, and invisible to an APM.
       * Use `logger` from `@/shared/lib`, which fans out to registered sinks —
       * its console sink carries the one sanctioned disable comment.
       */
      'no-console': 'error',
    },
  },

  /* Imports: resolution, ordering is Prettier's job, cycles are ours. */
  {
    files: ['**/*.{ts,tsx,mts}'],
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
      },
    },
    rules: {
      'import-x/no-cycle': ['error', { maxDepth: 5, ignoreExternal: true }],
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': ['error', { noUselessIndex: true }],
      'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
      // Named exports keep a slice's public API greppable; the files that must
      // default-export (Next conventions, configs) turn this off below.
      'import-x/no-default-export': 'error',
      // Relative imports that climb out of a slice sidestep its public API.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../*'],
              message:
                'Reach across slices through the layer alias (@/entities/user), not by climbing directories.',
            },
            {
              group: ['@/shared/api/generated/*'],
              message:
                'Import from @/shared/api instead — the generated client is re-exported there.',
            },
          ],
        },
      ],
    },
  },

  /* Accessibility. Every one of these is a real user-facing defect.
     The plugin itself is already registered by eslint-config-next, so only the
     rules are raised here — re-registering it is a hard config error. */
  {
    files: ['**/*.tsx'],
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,

      /* `region` is added to the rule's allowlist, not exempted from it: a
         region that scrolls has to be in the tab order or a keyboard user
         cannot reach the content to the side of it (WCAG 2.1.1), which is
         exactly what axe's `scrollable-region-focusable` checks. The rule
         ships with only `tabpanel` allowed. */
      'jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { tags: [], roles: ['tabpanel', 'region'], allowExpressionValues: true },
      ],
    },
  },

  /* Unicorn: the subset that catches genuine bugs, not the stylistic half. */
  {
    files: ['**/*.{ts,tsx,mts}'],
    plugins: { unicorn },
    rules: {
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-await-in-promise-methods': 'error',
      'unicorn/no-single-promise-in-promise-methods': 'error',
      'unicorn/no-invalid-fetch-options': 'error',
      'unicorn/no-useless-spread': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/throw-new-error': 'error',
    },
  },

  /* Feature-Sliced Design import direction. */
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': LAYERS.map(layer => ({
        type: layer,
        pattern: `src/${layer}/**`,
        partialMatch: false,
      })),
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          // `{{target.type}}` renders empty here, so the message names the rule
          // rather than the specific pair; the import path is in the report.
          message:
            'Forbidden upward import from the {{from.type}} layer — FSD layers depend downward only (app → views → widgets → features → entities → shared).',
          policies: forbiddenUpwardDependencies,
        },
      ],
      // Cross-slice and public-API rules are Steiger's job (fsd/forbidden-imports,
      // fsd/no-public-api-sidestep); it understands slices, this plugin sees layers.
    },
  },

  /* React / Next specifics not covered by core-web-vitals. */
  {
    files: ['src/**/*.tsx'],
    rules: {
      // A default export makes a component hard to find by name and blocks
      // consistent renaming — except where Next's file conventions require one.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use a const object with `as const` — enums do not erase cleanly.',
        },
      ],
    },
  },

  /* Next.js file conventions must default-export; the config files are CJS-ish. */
  {
    files: [
      // next-intl loads this by path and expects a default export.
      'src/shared/config/i18n/request.ts',
      'messages/*.d.json.ts',
      'src/app/**/{page,layout,template,loading,error,not-found,global-error,default,route,sitemap,robots,opengraph-image,icon,apple-icon}.tsx',
      'src/app/**/*.ts',
      '*.config.{ts,mts,mjs,js}',
      'src/proxy.ts',
      'src/instrumentation.ts',
    ],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },

  /* Tests get a longer leash: fixtures use `any`, assertions float promises. */
  {
    files: [
      '**/*.{test,spec}.{ts,tsx}',
      'e2e/**/*.ts',
      'src/shared/test/**/*.{ts,tsx}',
      '**/*.stories.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'boundaries/dependencies': 'off',
      // Test fixtures render bare anchors deliberately, to prove the component
      // does not wrap them in a <button>.
      '@next/next/no-html-link-for-pages': 'off',
    },
  },

  /* Build and maintenance scripts are CLIs — stdout is their user interface. */
  {
    files: ['scripts/**/*.mts', '*.config.{ts,mts,mjs}'],
    rules: { 'no-console': 'off' },
  },

  /* Plain-JS config files sit outside the TS program. */
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Must stay last: switches off every rule Prettier already handles.
  prettier,
]);
