import { beforeEach, describe, expect, it, vi } from 'vitest';

import requestConfig from './request';

const cookieStore = vi.hoisted(() => ({ get: vi.fn() }));
const headerStore = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(cookieStore),
  headers: () => Promise.resolve(headerStore),
}));

// `getRequestConfig` wraps the resolver; unwrapping it here lets the test call
// the resolver directly instead of standing up a next-intl request context.
vi.mock('next-intl/server', () => ({
  getRequestConfig: (resolver: unknown) => resolver,
}));

const resolve = requestConfig as unknown as () => Promise<{
  locale: string;
  messages: Record<string, unknown>;
}>;

describe('request config', () => {
  beforeEach(() => {
    cookieStore.get.mockReturnValue(undefined);
    headerStore.get.mockReturnValue(null);
  });

  it('uses the cookie when it holds a supported locale', async () => {
    cookieStore.get.mockReturnValue({ value: 'uk' });

    await expect(resolve()).resolves.toMatchObject({ locale: 'uk' });
  });

  it('prefers the cookie over the browser header', async () => {
    cookieStore.get.mockReturnValue({ value: 'en' });
    headerStore.get.mockReturnValue('uk-UA,uk;q=0.9');

    // The cookie is an explicit choice; the header is only a default.
    await expect(resolve()).resolves.toMatchObject({ locale: 'en' });
  });

  it('negotiates from Accept-Language when there is no cookie', async () => {
    headerStore.get.mockReturnValue('uk-UA,uk;q=0.9,en;q=0.5');

    await expect(resolve()).resolves.toMatchObject({ locale: 'uk' });
  });

  it('ignores a cookie holding an unsupported locale', async () => {
    // The cookie is client-writable, so its value is untrusted input.
    cookieStore.get.mockReturnValue({ value: 'de' });
    headerStore.get.mockReturnValue('uk');

    await expect(resolve()).resolves.toMatchObject({ locale: 'uk' });
  });

  it('falls back to English when nothing indicates a preference', async () => {
    await expect(resolve()).resolves.toMatchObject({ locale: 'en' });
  });

  it('loads the catalogue for the resolved locale', async () => {
    cookieStore.get.mockReturnValue({ value: 'uk' });

    const { messages } = await resolve();

    expect(messages['common']).toMatchObject({ appName: 'Studviro' });
    expect(messages['auth']).toHaveProperty('signIn', 'Увійти');
  });
});
