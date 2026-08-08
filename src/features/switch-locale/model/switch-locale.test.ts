import { beforeEach, describe, expect, it, vi } from 'vitest';

import { switchLocale } from './switch-locale';

const cookieStore = vi.hoisted(() => ({
  set: vi.fn(),
  get: vi.fn(() => undefined),
}));
const revalidatePath = vi.hoisted(() => vi.fn());
const getAccessToken = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({ cookies: () => Promise.resolve(cookieStore) }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/shared/auth', () => ({ getAccessToken }));
// See `shared/auth/session.test.ts` — the env guard assumes a client under jsdom.
vi.mock('@/env', () => ({
  env: { API_INTERNAL_URL: undefined, NEXT_PUBLIC_API_URL: 'http://localhost:3000' },
}));

describe('switchLocale', () => {
  beforeEach(() => {
    getAccessToken.mockResolvedValue(undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({}))),
    );
  });

  it('writes the choice to a year-long cookie', async () => {
    await switchLocale('uk');

    expect(cookieStore.set).toHaveBeenCalledWith(
      'NEXT_LOCALE',
      'uk',
      expect.objectContaining({ path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' }),
    );
  });

  it('works signed out, without touching the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await switchLocale('uk');

    expect(cookieStore.set).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('persists to the account when signed in, so the choice follows the user', async () => {
    getAccessToken.mockResolvedValue('access-token');
    const fetchMock = vi.fn(() => Promise.resolve(Response.json({})));
    vi.stubGlobal('fetch', fetchMock);

    await switchLocale('uk');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/api/v1/users/me');
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe(JSON.stringify({ locale: 'uk' }));
  });

  it('keeps the cookie even if persisting to the account fails', async () => {
    getAccessToken.mockResolvedValue('access-token');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    await expect(switchLocale('uk')).resolves.toBeUndefined();

    // Losing the language switch because the network blipped would be a worse
    // outcome than a preference that syncs on the next change.
    expect(cookieStore.set).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('rejects a locale it does not support', async () => {
    // A Server Action argument is attacker-controlled like any request body.
    await switchLocale('de' as 'uk');

    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('revalidates the layout, since every string below it changes', async () => {
    await switchLocale('en');

    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});
