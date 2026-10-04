import { describe, expect, it } from 'vitest';

import { describeDevice } from './device';

describe('describeDevice', () => {
  it.each([
    [
      'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
      'Firefox',
      'Linux',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0',
      'Edge',
      'Windows',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      'Safari',
      'iOS',
    ],
    [
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
      'Chrome',
      'Android',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
      'Safari',
      'macOS',
    ],
  ])('reads %s', (userAgent, browser, system) => {
    expect(describeDevice(userAgent)).toEqual({ browser, system });
  });

  it('admits what it does not recognise', () => {
    expect(describeDevice('curl/8.5.0')).toEqual({
      browser: undefined,
      system: undefined,
    });
    expect(describeDevice(null)).toEqual({ browser: undefined, system: undefined });
  });
});
