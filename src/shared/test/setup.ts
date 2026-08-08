import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { server } from './msw/server';

// Unhandled requests fail loudly: a test that silently hits the real network is
// a test that passes on your machine and flakes in CI.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

/**
 * jsdom implements neither `ResizeObserver` nor `matchMedia`, and both are used
 * by common UI primitives (popovers, responsive hooks). Without these, a
 * component that works in a browser throws on mount in a test.
 */
const noop = () => undefined;

if (typeof globalThis.ResizeObserver !== 'function') {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: class {
      observe = noop;
      unobserve = noop;
      disconnect = noop;
    },
  });
}

// Checked as a callable, not with `in`: jsdom declares the property but leaves
// it undefined, so an `in` guard reports it present and the polyfill is skipped.
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: noop,
      removeEventListener: noop,
      dispatchEvent: () => false,
    }),
  });
}
