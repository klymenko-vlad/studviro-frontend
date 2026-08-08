/** Matches ../backend/commitlint.config.mjs so both repos share one history format. */
const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'app',
        'views',
        'widgets',
        'features',
        'entities',
        'shared',
        'ui',
        'api',
        'i18n',
        'config',
        'ci',
        'deps',
        'test',
        'docs',
      ],
    ],
    'scope-empty': [0],
    'body-max-line-length': [0],
  },
};

export default config;
