import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/** Node-side interceptor, started once per Vitest run from `setup.ts`. */
export const server = setupServer(...handlers);
