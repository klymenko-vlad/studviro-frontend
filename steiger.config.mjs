import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

/**
 * Steiger checks FSD *structure* — slice shape, segment naming, public APIs.
 * Import *direction* is enforced by eslint-plugin-boundaries in eslint.config.mjs,
 * so violations show up in the editor too.
 *
 * Note on `views/`: canonical FSD calls this layer `pages`, but `src/pages` is the
 * Next.js Pages Router directory and would be picked up as routes. We use `views/`
 * and let eslint-plugin-boundaries police it, since Steiger only recognises the
 * canonical name.
 */
export default defineConfig([
  ...fsd.configs.recommended,

  {
    ignores: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.stories.tsx',
      './src/shared/api/generated/**',
      // Not an FSD layer name — see note above.
      './src/views/**',
    ],
  },

  {
    rules: {
      // `views` would otherwise be reported as a misspelt `pages`.
      'fsd/typo-in-layer-name': 'off',
      // Next.js owns src/app; route files are UI by necessity.
      'fsd/no-ui-in-app': 'off',

      'fsd/public-api': 'error',
      'fsd/forbidden-imports': 'error',
      'fsd/no-public-api-sidestep': 'error',
      'fsd/no-layer-public-api': 'error',
      'fsd/no-reserved-folder-names': 'error',
      'fsd/segments-by-purpose': 'error',
      'fsd/shared-lib-grouping': 'error',
      'fsd/ambiguous-slice-names': 'error',

      /* Advisory: these fire on legitimately small early-stage slices. The
         `entities/user` slice, for instance, has no consumer yet — it exists as
         the reference shape for the next one. */
      'fsd/insignificant-slice': 'warn',
      'fsd/excessive-slicing': 'warn',
      'fsd/no-segmentless-slices': 'warn',
      'fsd/repetitive-naming': 'warn',
    },
  },
]);
