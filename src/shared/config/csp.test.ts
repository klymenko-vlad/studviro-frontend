import { describe, expect, it } from 'vitest';

import { buildContentSecurityPolicy, createNonce, THEME_INIT_SCRIPT } from './csp';

/** Parses a policy string into directive → value, so tests assert on meaning. */
function parse(csp: string): Record<string, string> {
  return Object.fromEntries(
    csp.split('; ').map(directive => {
      const [name, ...rest] = directive.split(' ');
      return [name ?? '', rest.join(' ')];
    }),
  );
}

describe('THEME_INIT_SCRIPT', () => {
  it('reads the same storage key the Zustand store persists to', async () => {
    const [{ THEME_STORAGE_KEY }, { useThemeStore }] = await Promise.all([
      import('./app'),
      import('@/shared/model'),
    ]);

    expect(THEME_INIT_SCRIPT).toContain(JSON.stringify(THEME_STORAGE_KEY));
    // Asserts the store actually persists under that key, not just that both
    // modules reference the same constant.
    expect(useThemeStore.persist.getOptions().name).toBe(THEME_STORAGE_KEY);
  });
});

describe('buildContentSecurityPolicy', () => {
  const production = buildContentSecurityPolicy({
    isProduction: true,
    isSecureOrigin: true,
    nonce: 'test-nonce',
  });

  it('allows inline script only by nonce', () => {
    const { 'script-src': scriptSrc } = parse(production);

    expect(scriptSrc).toContain(`'nonce-test-nonce'`);
    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(scriptSrc).not.toContain('unsafe-eval');
  });

  it('never emits a hash, which would make browsers ignore the nonce path', () => {
    // With any hash present the spec requires `'unsafe-inline'` to be ignored,
    // and Next's per-render RSC bootstrap scripts — which no committed hash can
    // cover — stop executing. The page then never hydrates.
    expect(production).not.toContain('sha256-');
  });

  it('allows no cross-origin fetch destination when no object store is configured', () => {
    // Browser-side API calls go through the same-origin BFF at /api/proxy, so
    // an injected script has nowhere off-origin to send what it steals.
    expect(parse(production)['connect-src']).toBe(`'self'`);
  });

  it('lets the browser write to the object store and nowhere else', () => {
    const csp = buildContentSecurityPolicy({
      isProduction: true,
      isSecureOrigin: true,
      nonce: 'test-nonce',
      storageOrigin: 'https://files.example.org',
    });

    expect(parse(csp)['connect-src']).toBe(`'self' https://files.example.org`);
  });

  it('reduces a configured store URL to its origin', () => {
    const csp = buildContentSecurityPolicy({
      isProduction: false,
      isSecureOrigin: false,
      nonce: 'test-nonce',
      storageOrigin: 'http://localhost:9000/studviro/some/key?X-Amz-Signature=abc',
    });

    expect(parse(csp)['connect-src']).toBe(`'self' http://localhost:9000`);
  });

  it.each(['not a url', 'javascript:alert(1)', 'http://a.example; script-src *'])(
    'refuses %j as a store origin rather than widening the policy',
    storageOrigin => {
      expect(() =>
        buildContentSecurityPolicy({
          isProduction: true,
          isSecureOrigin: true,
          nonce: 'test-nonce',
          storageOrigin,
        }),
      ).toThrow();
    },
  );

  it('lets a course page frame the two video players it embeds, and nothing else', () => {
    expect(parse(production)['frame-src']).toBe(
      'https://www.youtube-nocookie.com https://player.vimeo.com',
    );
  });

  it.each(['frame-ancestors', 'object-src'])('locks down %s', directive => {
    expect(parse(production)[directive]).toBe(`'none'`);
  });

  it('upgrades insecure requests only in production', () => {
    expect(production).toContain('upgrade-insecure-requests');

    const development = buildContentSecurityPolicy({
      isProduction: false,
      isSecureOrigin: false,
      nonce: 'test-nonce',
    });
    expect(development).not.toContain('upgrade-insecure-requests');
  });

  it('never upgrades on a plain-http origin, even in production', () => {
    // A production build served over http — CI's e2e run, a bare `next start` —
    // would otherwise have every script rewritten to an https URL that nothing
    // answers. WebKit enforces this on localhost where Chromium does not, so it
    // fails on one browser only and reads as flake.
    const httpProduction = buildContentSecurityPolicy({
      isProduction: true,
      isSecureOrigin: false,
      nonce: 'test-nonce',
    });

    expect(httpProduction).not.toContain('upgrade-insecure-requests');
  });

  it('grants Turbopack the eval it needs in development only', () => {
    const development = buildContentSecurityPolicy({
      isProduction: false,
      isSecureOrigin: false,
      nonce: 'test-nonce',
    });

    expect(parse(development)['script-src']).toContain('unsafe-eval');
  });
});

describe('createNonce', () => {
  it('never repeats', () => {
    const nonces = new Set(Array.from({ length: 500 }, createNonce));

    // A predictable or reused nonce is worth no more than 'unsafe-inline'.
    expect(nonces.size).toBe(500);
  });

  it('carries at least 128 bits of entropy', () => {
    expect(Buffer.from(createNonce(), 'base64')).toHaveLength(16);
  });
});
