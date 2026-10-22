import { describe, expect, it } from 'vitest';

import { TONE_HUES, toneOf, toneStyle } from './tone';

describe('toneOf', () => {
  it('gives the same course the same hue every time', () => {
    expect(toneOf('FEI-P106')).toBe(toneOf('FEI-P106'));
  });

  it('picks from the palette', () => {
    expect(TONE_HUES).toContain(toneOf('PF-P202'));
  });

  it('spreads a realistic set of codes over several hues', () => {
    const codes = ['FEI-P106', 'FF-P102', 'FEI-P107', 'PF-P202', 'PF-P108', 'FEI-P101'];
    expect(new Set(codes.map(toneOf)).size).toBeGreaterThan(3);
  });

  it('wears the brand hue when there is nothing to key on', () => {
    expect(toneOf('')).toBe(TONE_HUES[0]);
  });
});

describe('toneStyle', () => {
  it('passes the hue as the custom property the tone utility reads', () => {
    expect(toneStyle('FEI-P106')).toEqual({ '--hue': toneOf('FEI-P106') });
  });
});
