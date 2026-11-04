import type { CSSProperties } from 'react';

/** Eight hues 45° apart, so no two courses read as the same colour; brand first. */
export const TONE_HUES = [265, 220, 175, 130, 85, 40, 355, 310] as const;

export type ToneHue = (typeof TONE_HUES)[number];

/** A stable hue for a key — a course's code, so its colour survives a rename. */
export function toneOf(key: string): ToneHue {
  if (key === '') return TONE_HUES[0];

  let hash = 5381;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 33) ^ key.charCodeAt(index);
  }
  return TONE_HUES[Math.abs(hash) % TONE_HUES.length] ?? TONE_HUES[0];
}

/** The inline style that hands an element its tone; pair with the `tone` class. */
export function toneStyle(key: string): CSSProperties {
  return { '--hue': toneOf(key) } as CSSProperties;
}
