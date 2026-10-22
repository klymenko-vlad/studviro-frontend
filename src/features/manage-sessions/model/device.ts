const BROWSERS: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/CrOS/, 'ChromeOS'],
  [/Linux/, 'Linux'],
];

export interface Device {
  readonly browser: string | undefined;
  readonly system: string | undefined;
}

function firstMatch(userAgent: string, table: [RegExp, string][]): string | undefined {
  return table.find(([pattern]) => pattern.test(userAgent))?.[1];
}

export function describeDevice(userAgent: string | null | undefined): Device {
  if (!userAgent) return { browser: undefined, system: undefined };

  return {
    browser: firstMatch(userAgent, BROWSERS),
    system: firstMatch(userAgent, SYSTEMS),
  };
}
